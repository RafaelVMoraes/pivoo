-- Enable RLS on system-only tables (service role bypasses RLS)
ALTER TABLE notification_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_job_registry ENABLE ROW LEVEL SECURITY;