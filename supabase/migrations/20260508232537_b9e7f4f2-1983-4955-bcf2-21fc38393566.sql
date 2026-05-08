
-- 1. Simplified deduct_credit: 1 credit per full alignment
CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_bal INTEGER;
  v_email     TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  IF lower(coalesce(v_email, '')) IN ('djcoolmike@gmail.com') THEN
    RETURN 9999;
  END IF;

  SELECT balance INTO current_bal
    FROM credit_balances WHERE user_id = p_user_id FOR UPDATE;

  IF current_bal IS NULL THEN
    INSERT INTO credit_balances (user_id, balance, has_used_free_credit)
      VALUES (p_user_id, 0, true);
    RETURN -1;
  END IF;

  IF current_bal <= 0 THEN
    RETURN -1;
  END IF;

  UPDATE credit_balances
    SET balance = balance - 1, has_used_free_credit = true, updated_at = now()
    WHERE user_id = p_user_id;
  RETURN current_bal - 1;
END;
$function$;

-- 2. consume_export now deducts from the same balance pool
CREATE OR REPLACE FUNCTION public.consume_export(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_bal INTEGER;
  v_email     TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  IF lower(coalesce(v_email, '')) IN ('djcoolmike@gmail.com') THEN
    RETURN 9999;
  END IF;

  SELECT balance INTO current_bal
    FROM credit_balances WHERE user_id = p_user_id FOR UPDATE;

  IF current_bal IS NULL OR current_bal <= 0 THEN
    RETURN -1;
  END IF;

  UPDATE credit_balances
    SET balance = balance - 1, has_used_free_credit = true, updated_at = now()
    WHERE user_id = p_user_id;
  RETURN current_bal - 1;
END;
$function$;

-- 3. Grant 1 starter credit to new users on signup
CREATE OR REPLACE FUNCTION public.grant_starter_credit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.credit_balances (user_id, balance, has_used_free_credit)
    VALUES (NEW.id, 1, false)
    ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created_grant_starter ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_starter
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_starter_credit();
