
-- Add status, ip_address, device_fingerprint to referral_redemptions
ALTER TABLE public.referral_redemptions 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS device_fingerprint text;

-- Update redeem_referral to NOT award credits, just mark as pending
CREATE OR REPLACE FUNCTION public.redeem_referral(p_code text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_referral_id UUID;
  v_referrer_id UUID;
  v_redeemer_id UUID;
  v_uses INTEGER;
  v_max_uses INTEGER;
BEGIN
  v_redeemer_id := auth.uid();
  IF v_redeemer_id IS NULL THEN
    RETURN 'not_authenticated';
  END IF;

  -- Check if user already redeemed any code
  IF EXISTS (SELECT 1 FROM referral_redemptions WHERE redeemed_by = v_redeemer_id) THEN
    RETURN 'already_redeemed';
  END IF;

  -- Find the referral code
  SELECT id, user_id, uses, max_uses INTO v_referral_id, v_referrer_id, v_uses, v_max_uses
    FROM referral_codes WHERE code = p_code FOR UPDATE;

  IF v_referral_id IS NULL THEN
    RETURN 'invalid_code';
  END IF;

  -- Can't use own code
  IF v_referrer_id = v_redeemer_id THEN
    RETURN 'own_code';
  END IF;

  IF v_uses >= v_max_uses THEN
    RETURN 'code_exhausted';
  END IF;

  -- Record redemption as PENDING (no credits yet)
  INSERT INTO referral_redemptions (referral_code_id, redeemed_by, status) 
    VALUES (v_referral_id, v_redeemer_id, 'pending');

  -- Increment uses
  UPDATE referral_codes SET uses = uses + 1 WHERE id = v_referral_id;

  RETURN 'success';
END;
$function$;

-- Create function to fulfill referral bonus after payment
CREATE OR REPLACE FUNCTION public.fulfill_referral_bonus(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_redemption RECORD;
  v_referrer_id UUID;
BEGIN
  -- Find a pending redemption for this user
  SELECT rr.id, rr.referral_code_id, rc.user_id as referrer_id
    INTO v_redemption
    FROM referral_redemptions rr
    JOIN referral_codes rc ON rc.id = rr.referral_code_id
    WHERE rr.redeemed_by = p_user_id AND rr.status = 'pending'
    LIMIT 1
    FOR UPDATE OF rr;

  IF v_redemption IS NULL THEN
    RETURN false;
  END IF;

  v_referrer_id := v_redemption.referrer_id;

  -- Mark as earned
  UPDATE referral_redemptions SET status = 'earned' WHERE id = v_redemption.id;

  -- Award 3 credits to the referred user (new user)
  INSERT INTO credit_balances (user_id, balance) VALUES (p_user_id, 3)
    ON CONFLICT (user_id) DO UPDATE SET balance = credit_balances.balance + 3, updated_at = now();

  -- Award 3 credits to the referrer
  INSERT INTO credit_balances (user_id, balance) VALUES (v_referrer_id, 3)
    ON CONFLICT (user_id) DO UPDATE SET balance = credit_balances.balance + 3, updated_at = now();

  RETURN true;
END;
$function$;

-- Add unique constraint on user_id for credit_balances (needed for ON CONFLICT)
-- This may already exist, so use IF NOT EXISTS pattern
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'credit_balances_user_id_key'
  ) THEN
    ALTER TABLE public.credit_balances ADD CONSTRAINT credit_balances_user_id_key UNIQUE (user_id);
  END IF;
END$$;
