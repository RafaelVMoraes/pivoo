import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const adminClient = createClient(supabaseUrl, serviceRoleKey);
const authClient = createClient(supabaseUrl, anonKey);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace('Bearer ', '');
    if (!jwt) return Response.json({ success: false, error: 'Missing auth token' }, { status: 401, headers: corsHeaders });

    const { data: authData, error: authError } = await authClient.auth.getUser(jwt);
    if (authError || !authData.user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const subscription = body?.subscription;
    const deviceKey = body?.deviceKey ?? 'primary';
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return Response.json({ success: false, error: 'Invalid subscription payload' }, { status: 400, headers: corsHeaders });
    }

    const { error } = await adminClient.from('push_subscriptions').upsert({
      user_id: authData.user.id,
      device_key: deviceKey,
      user_agent: req.headers.get('user-agent'),
      subscription,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,device_key' });

    if (error) throw error;

    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500, headers: corsHeaders });
  }
});
