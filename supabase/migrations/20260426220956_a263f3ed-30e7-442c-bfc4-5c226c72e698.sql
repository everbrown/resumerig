
-- Allowlist owner/test account for unlimited credit + export usage.
-- Returns 9999 (the same "unlimited pass" sentinel used for the 24h Bypass Pass)
-- when the user matches the allowlist; otherwise falls through to normal logic.

CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_bal INTEGER;
  pass_expiry TIMESTAMPTZ;
  v_email     TEXT;
BEGIN
  -- Owner allowlist: unlimited, no deduction, no row required.
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  IF lower(coalesce(v_email, '')) IN ('djcoolmike@gmail.com') THEN
    RETURN 9999;
  END IF;

  SELECT balance, pass_expires_at INTO current_bal, pass_expiry
    FROM credit_balances WHERE user_id = p_user_id FOR UPDATE;

  IF current_bal IS NULL THEN
    INSERT INTO credit_balances (user_id, balance) VALUES (p_user_id, 0);
    RETURN -1;
  END IF;

  -- Active 24h pass: unlimited, no deduction
  IF pass_expiry IS NOT NULL AND pass_expiry > now() THEN
    RETURN 9999;
  END IF;

  IF current_bal <= 0 THEN
    RETURN -1;
  END IF;

  UPDATE credit_balances SET balance = balance - 1, updated_at = now() WHERE user_id = p_user_id;
  RETURN current_bal - 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.consume_export(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  remaining INTEGER;
  v_email   TEXT;
BEGIN
  -- Owner allowlist: unlimited exports.
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  IF lower(coalesce(v_email, '')) IN ('djcoolmike@gmail.com') THEN
    RETURN 9999;
  END IF;

  SELECT exports_remaining INTO remaining
    FROM credit_balances WHERE user_id = p_user_id FOR UPDATE;

  IF remaining IS NULL OR remaining <= 0 THEN
    RETURN -1;
  END IF;

  UPDATE credit_balances
    SET exports_remaining = exports_remaining - 1, updated_at = now()
    WHERE user_id = p_user_id;
  RETURN remaining - 1;
END;
$function$;
