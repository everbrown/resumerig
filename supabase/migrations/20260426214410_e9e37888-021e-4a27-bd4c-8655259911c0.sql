
ALTER TABLE public.credit_balances
  ADD COLUMN IF NOT EXISTS pass_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS exports_remaining INTEGER NOT NULL DEFAULT 0;

-- Update deduct_credit so an active pass bypasses credit consumption.
-- Returns:
--   -1  -> no credits and no active pass
--   9999 -> active pass (unlimited mode), no credit consumed
--   N   -> remaining balance after consumption
CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_bal INTEGER;
  pass_expiry TIMESTAMPTZ;
BEGIN
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

-- Consume one export. Returns remaining export quota, or -1 if none available.
CREATE OR REPLACE FUNCTION public.consume_export(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  remaining INTEGER;
BEGIN
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
