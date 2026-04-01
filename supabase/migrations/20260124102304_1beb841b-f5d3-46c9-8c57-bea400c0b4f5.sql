/**************************************************************************************************
* Migration: Harden Notification Scheduling Functions Security Context
*
* Description:
*   - This migration updates the notification scheduling functions (`enqueue_notification` and
*     `enqueue_due_notifications`) in the database to:
*       1. Add SECURITY DEFINER so they always execute with elevated privileges (not caller's rights).
*       2. Restrict who can execute these functions, revoking PUBLIC access and granting EXECUTE
*          only to the service_role. This prevents unauthorized invocation and ensures only trusted
*          system processes can enqueue notifications.
*   - These steps improve the security posture by preventing privilege escalation and unauthorized
*     use of notification-related scheduling logic.
**************************************************************************************************/

-- 1. Harden function privileges with SECURITY DEFINER
--    This causes the function to always run with the privileges of the function owner,
--    regardless of which database role calls it.
ALTER FUNCTION public.enqueue_notification(uuid) SECURITY DEFINER;
ALTER FUNCTION public.enqueue_due_notifications() SECURITY DEFINER;

-- 2. Revoke EXECUTE privilege from PUBLIC for both functions
--    This prevents any database user/role from calling these notification functions by default.
REVOKE EXECUTE ON FUNCTION public.enqueue_notification(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enqueue_due_notifications() FROM PUBLIC;

-- 3. Grant EXECUTE privilege to the "service_role" only
--    This enables automated backend services or edge functions running as this privileged role
--    to safely trigger these notification scheduling functions.
GRANT EXECUTE ON FUNCTION public.enqueue_notification(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_due_notifications() TO service_role;