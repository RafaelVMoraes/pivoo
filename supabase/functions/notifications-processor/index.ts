import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import webpush from 'npm:web-push@3.6.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const vapidMail = Deno.env.get('VAPID_mail') || Deno.env.get('VAPID_MAIL') || '';
const vapidPublic = Deno.env.get('VAPID_publicKey') || Deno.env.get('VAPID_PUBLIC_KEY') || '';
const vapidPrivate = Deno.env.get('VAPID_privateKey') || Deno.env.get('VAPID_PRIVATE_KEY') || '';

webpush.setVapidDetails(`mailto:${vapidMail}`, vapidPublic, vapidPrivate);

const adminClient = createClient(supabaseUrl, serviceRoleKey);
const authClient = createClient(supabaseUrl, anonKey);
const BATCH_SIZE = 50;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (!['POST', 'GET'].includes(req.method)) return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace('Bearer ', '');
    if (jwt) {
      const { data, error } = await authClient.auth.getUser(jwt);
      if (error || !data.user) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { data: queued, error } = await adminClient
      .from('notifications_queue')
      .select('id,user_id,type,payload')
      .eq('processed', false)
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(BATCH_SIZE);
    if (error) throw error;

    if (!queued?.length) return Response.json({ success: true, processed: 0, message: 'No due notifications' }, { headers: corsHeaders });

    const results = [];
    for (const item of queued) {
      const { data: subscriptions } = await adminClient
        .from('push_subscriptions')
        .select('id,subscription')
        .eq('user_id', item.user_id);

      let delivered = false;
      for (const sub of subscriptions ?? []) {
        try {
          await webpush.sendNotification(sub.subscription, JSON.stringify(item.payload));
          delivered = true;
        } catch (err: any) {
          const statusCode = err?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await adminClient.from('push_subscriptions').delete().eq('id', sub.id);
          }
        }
      }

      await adminClient.from('notification_logs').insert({
        notification_queue_id: item.id,
        user_id: item.user_id,
        type: item.type,
        delivered,
      });

      await adminClient.from('notifications_queue').update({ processed: true, processed_at: new Date().toISOString() }).eq('id', item.id);
      results.push({ id: item.id, delivered });
    }

    return Response.json({ success: true, processed: results.length, results }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500, headers: corsHeaders });
  }
});
