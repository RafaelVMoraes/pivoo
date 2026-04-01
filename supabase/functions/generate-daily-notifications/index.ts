import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { applyTemplate } from '../_shared/notification-templates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const adminClient = createClient(supabaseUrl, serviceRoleKey);
const authClient = createClient(supabaseUrl, anonKey);

function atUserTime(dateIso: string, hhmm: string, timezone: string) {
  const date = new Date(dateIso);
  const [h, m] = hhmm.split(':').map(Number);
  const tzNow = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  tzNow.setHours(h, m, 0, 0);
  return new Date(tzNow.getTime() - (tzNow.getTimezoneOffset() * 60000)).toISOString();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (!['POST', 'GET'].includes(req.method)) return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });

  try {
    const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    if (jwt) {
      const { data, error } = await authClient.auth.getUser(jwt);
      if (error || !data.user) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const today = new Date();
    const todayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const todayEnd = new Date(todayStart); todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

    const { data: users } = await adminClient.from('profiles').select('user_id');
    let queued = 0;

    for (const profile of users ?? []) {
      const userId = profile.user_id;

      const { data: pref } = await adminClient
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      const p = pref ?? { mode: 'minimal', morning_enabled: true, midday_enabled: false, evening_enabled: true, night_enabled: false, ai_reminder_enabled: true, self_discovery_enabled: true, morning_time: '08:30:00', midday_time: '12:30:00', evening_time: '18:00:00', night_time: '21:00:00', timezone: 'UTC' };

      const { count: activeGoals = 0 } = await adminClient.from('goals').select('*', { count: 'exact', head: true }).eq('user_id', userId).in('status', ['active', 'in_progress']);
      const { count: completedToday = 0 } = await adminClient.from('check_ins').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', todayStart.toISOString()).lt('created_at', todayEnd.toISOString());
      const dueCount = activeGoals;
      const completion = activeGoals > 0 ? Math.round((completedToday / activeGoals) * 100) : 100;

      const scheduleInsert = async (type: string, scheduledFor: string, payload: Record<string, unknown>) => {
        const { error } = await adminClient.from('notifications_queue').insert({ user_id: userId, type, payload, scheduled_for: scheduledFor });
        if (!error) queued += 1;
      };

      if (p.morning_enabled) {
        const content = applyTemplate('morning', { count: dueCount });
        await scheduleInsert('morning', atUserTime(todayStart.toISOString(), p.morning_time.slice(0, 5), p.timezone), { ...content, data: { type: 'morning' } });
      }

      const hasAfternoonOnlyPlan = p.morning_enabled === false && p.midday_enabled === true;
      if (p.midday_enabled && completion < 80) {
        if (completedToday === 0 || (p.mode === 'intensive' && completion < 50)) {
          const key = completedToday === 0 ? 'midday_nudge' : 'late_day_nudge';
          const content = applyTemplate(key, { count: dueCount, completion });
          const scheduled = completedToday === 0
            ? atUserTime(todayStart.toISOString(), p.midday_time.slice(0, 5), p.timezone)
            : atUserTime(todayStart.toISOString(), '19:00', p.timezone);
          await scheduleInsert(hasAfternoonOnlyPlan ? 'morning' : key, scheduled, { ...content, data: { type: hasAfternoonOnlyPlan ? 'morning' : key } });
        }
      }

      if (p.evening_enabled) {
        const content = applyTemplate('evening', { completion });
        await scheduleInsert('evening', atUserTime(todayStart.toISOString(), p.evening_time.slice(0, 5), p.timezone), { ...content, data: { type: 'evening' } });
      }

      if (p.night_enabled) {
        const content = applyTemplate('night', { completion });
        await scheduleInsert('night', atUserTime(todayStart.toISOString(), p.night_time.slice(0, 5), p.timezone), { ...content, data: { type: 'night' } });
      }

      if (p.ai_reminder_enabled && (activeGoals < 5 || completion < 40)) {
        const { data: lastAi } = await adminClient.from('notifications_queue').select('created_at').eq('user_id', userId).eq('type', 'ai_reminder').order('created_at', { ascending: false }).limit(1).maybeSingle();
        const canSend = !lastAi || (Date.now() - new Date(lastAi.created_at).getTime() > 1000 * 60 * 60 * 24 * 60);
        if (canSend) {
          const content = applyTemplate('ai_reminder');
          await scheduleInsert('ai_reminder', today.toISOString(), { ...content, data: { type: 'ai_reminder' } });
        }
      }

      if (p.self_discovery_enabled) {
        const { count: totalGoals = 0 } = await adminClient.from('goals').select('*', { count: 'exact', head: true }).eq('user_id', userId);
        const { count: abandonedGoals = 0 } = await adminClient.from('goals').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'archived').gte('updated_at', new Date(Date.now() - 1000*60*60*24*30).toISOString());
        const { count: sentSelf = 0 } = await adminClient.from('notifications_queue').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('type', 'self_discovery');
        if (sentSelf < 4 && (totalGoals < 3 || (totalGoals > 0 && abandonedGoals / totalGoals > 0.5))) {
          const messageKey = (['self_discovery_1', 'self_discovery_2', 'self_discovery_3', 'self_discovery_4'] as const)[sentSelf];
          const content = applyTemplate(messageKey);
          await scheduleInsert('self_discovery', today.toISOString(), { ...content, data: { type: 'self_discovery' } });
        }
      }
    }

    return Response.json({ success: true, queued }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500, headers: corsHeaders });
  }
});
