
-- Resume history table
CREATE TABLE public.resume_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_resume TEXT NOT NULL,
  job_description TEXT NOT NULL,
  tuned_resume TEXT NOT NULL,
  pivot_pitch TEXT,
  before_score INTEGER,
  after_score INTEGER,
  target_role TEXT,
  translator_table JSONB,
  title_changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.resume_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history"
  ON public.resume_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
  ON public.resume_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own history"
  ON public.resume_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Referral codes table
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL UNIQUE,
  uses INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral codes"
  ON public.referral_codes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own referral codes"
  ON public.referral_codes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Referral redemptions table to track who used which code
CREATE TABLE public.referral_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code_id UUID REFERENCES public.referral_codes(id) ON DELETE CASCADE NOT NULL,
  redeemed_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(redeemed_by)
);

ALTER TABLE public.referral_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions"
  ON public.referral_redemptions FOR SELECT
  TO authenticated
  USING (auth.uid() = redeemed_by);

CREATE POLICY "Authenticated users can redeem codes"
  ON public.referral_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = redeemed_by);

-- Cover letters table
CREATE TABLE public.cover_letters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resume_history_id UUID REFERENCES public.resume_history(id) ON DELETE SET NULL,
  job_description TEXT NOT NULL,
  cover_letter TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cover letters"
  ON public.cover_letters FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cover letters"
  ON public.cover_letters FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to redeem a referral code (awards 1 credit to redeemer + 1 to referrer)
CREATE OR REPLACE FUNCTION public.redeem_referral(p_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- Record redemption
  INSERT INTO referral_redemptions (referral_code_id, redeemed_by) VALUES (v_referral_id, v_redeemer_id);

  -- Increment uses
  UPDATE referral_codes SET uses = uses + 1 WHERE id = v_referral_id;

  -- Award 1 credit to redeemer
  INSERT INTO credit_balances (user_id, balance) VALUES (v_redeemer_id, 1)
    ON CONFLICT (user_id) DO UPDATE SET balance = credit_balances.balance + 1, updated_at = now();

  -- Award 1 credit to referrer
  INSERT INTO credit_balances (user_id, balance) VALUES (v_referrer_id, 1)
    ON CONFLICT (user_id) DO UPDATE SET balance = credit_balances.balance + 1, updated_at = now();

  RETURN 'success';
END;
$$;
