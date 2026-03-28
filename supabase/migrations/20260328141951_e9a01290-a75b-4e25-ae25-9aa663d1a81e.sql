CREATE TABLE public.credit_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own credits"
ON public.credit_balances FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own credits"
ON public.credit_balances FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits"
ON public.credit_balances FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_bal INTEGER;
BEGIN
  SELECT balance INTO current_bal FROM credit_balances WHERE user_id = p_user_id FOR UPDATE;
  
  IF current_bal IS NULL THEN
    INSERT INTO credit_balances (user_id, balance) VALUES (p_user_id, 4);
    RETURN 4;
  END IF;
  
  IF current_bal <= 0 THEN
    RETURN -1;
  END IF;
  
  UPDATE credit_balances SET balance = balance - 1, updated_at = now() WHERE user_id = p_user_id;
  RETURN current_bal - 1;
END;
$$;