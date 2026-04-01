-- Notification engine foundation: schema, policies, helper functions, and cron jobs

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_mode') THEN
    CREATE TYPE public.notification_mode AS ENUM ('minimal', 'standard', 'intensive');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  mode public.notification_mode NOT NULL DEFAULT 'minimal',
  morning_enabled boolean NOT NULL DEFAULT true,
  midday_enabled boolean NOT NULL DEFAULT false,
  evening_enabled boolean NOT NULL DEFAULT true,
  night_enabled boolean NOT NULL DEFAULT false,
  ai_reminder_enabled boolean NOT NULL DEFAULT true,
  self_discovery_enabled boolean NOT NULL DEFAULT true,
  morning_time time NOT NULL DEFAULT '08:30:00',
  midday_time time NOT NULL DEFAULT '12:30:00',
  evening_time time NOT NULL DEFAULT '18:00:00',
  night_time time NOT NULL DEFAULT '21:00:00',
  timezone text NOT NULL DEFAULT 'UTC',
  adaptive_engine_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  payload jsonb NOT NULL,
  scheduled_for timestamptz NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_queue_scheduled_for_idx ON public.notifications_queue (scheduled_for);
CREATE INDEX IF NOT EXISTS notifications_queue_processed_idx ON public.notifications_queue (processed);
CREATE INDEX IF NOT EXISTS notifications_queue_user_id_type_date_idx ON public.notifications_queue (user_id, type, scheduled_for);

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_queue_id uuid REFERENCES public.notifications_queue(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  delivered boolean NOT NULL DEFAULT false,
  opened boolean NOT NULL DEFAULT false,
  provider_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_activity_presence_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'app_open'
);
CREATE INDEX IF NOT EXISTS user_activity_presence_logs_user_id_active_at_idx ON public.user_activity_presence_logs (user_id, active_at DESC);

ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS endpoint text GENERATED ALWAYS AS ((subscription->>'endpoint')) STORED;

ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS device_key text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'push_subscriptions_user_device_unique') THEN
    ALTER TABLE public.push_subscriptions
      ADD CONSTRAINT push_subscriptions_user_device_unique UNIQUE NULLS NOT DISTINCT (user_id, device_key);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON public.push_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS push_subscriptions_endpoint_idx ON public.push_subscriptions (endpoint);

CREATE OR REPLACE FUNCTION public.apply_notification_mode_defaults()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.mode = 'minimal' THEN
    NEW.morning_enabled := true;
    NEW.midday_enabled := false;
    NEW.evening_enabled := true;
    NEW.night_enabled := false;
  ELSIF NEW.mode = 'standard' THEN
    NEW.morning_enabled := true;
    NEW.midday_enabled := true;
    NEW.evening_enabled := true;
    NEW.night_enabled := false;
  ELSE
    NEW.morning_enabled := true;
    NEW.midday_enabled := true;
    NEW.evening_enabled := true;
    NEW.night_enabled := true;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_notification_preferences_mode_defaults ON public.user_notification_preferences;
CREATE TRIGGER user_notification_preferences_mode_defaults
  BEFORE INSERT OR UPDATE OF mode ON public.user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_notification_mode_defaults();

CREATE OR REPLACE FUNCTION public.update_notification_preferences_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_notification_preferences_updated_at ON public.user_notification_preferences;
CREATE TRIGGER user_notification_preferences_updated_at
  BEFORE UPDATE ON public.user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notification_preferences_updated_at();

ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_presence_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own notification preferences" ON public.user_notification_preferences;
CREATE POLICY "Users can manage own notification preferences"
ON public.user_notification_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own notification logs" ON public.notification_logs;
CREATE POLICY "Users can view own notification logs"
ON public.notification_logs
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own activity presence logs" ON public.user_activity_presence_logs;
CREATE POLICY "Users can insert own activity presence logs"
ON public.user_activity_presence_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own activity presence logs" ON public.user_activity_presence_logs;
CREATE POLICY "Users can view own activity presence logs"
ON public.user_activity_presence_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Internal system table: queue remains service-role only under RLS

-- Keep cron registration traceability
CREATE TABLE IF NOT EXISTS public.cron_job_registry (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name text UNIQUE NOT NULL,
  job_id bigint,
  created_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  PERFORM cron.unschedule('notifications-processor-every-5-min');
EXCEPTION WHEN others THEN NULL;
END $$;

SELECT cron.schedule(
  'notifications-processor-every-5-min',
  '*/5 * * * *',
  $$SELECT net.http_post(
      url:='https://yeyoydltgoftjnaqcwky.supabase.co/functions/v1/notifications-processor',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body:='{"source":"cron"}'::jsonb
    );$$
);

DO $$
BEGIN
  PERFORM cron.unschedule('generate-daily-notifications-0005-utc');
EXCEPTION WHEN others THEN NULL;
END $$;

SELECT cron.schedule(
  'generate-daily-notifications-0005-utc',
  '5 0 * * *',
  $$SELECT net.http_post(
      url:='https://yeyoydltgoftjnaqcwky.supabase.co/functions/v1/generate-daily-notifications',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body:='{"source":"cron"}'::jsonb
    );$$
);
