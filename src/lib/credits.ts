import { supabase } from "@/integrations/supabase/client";

export interface CreditStatus {
  hasUsedFreeCredit: boolean;
  balance: number;
  isAuthenticated: boolean;
}

export async function getCreditStatus(): Promise<CreditStatus> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { hasUsedFreeCredit: false, balance: 0, isAuthenticated: false };
  }

  const { data } = await supabase
    .from("credit_balances")
    .select("balance, has_used_free_credit")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    hasUsedFreeCredit: data?.has_used_free_credit ?? false,
    balance: data?.balance ?? 0,
    isAuthenticated: true,
  };
}

export async function markFreeCreditUsed(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("credit_balances")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("credit_balances")
      .update({ has_used_free_credit: true, updated_at: new Date().toISOString() } as any)
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("credit_balances")
      .insert({ user_id: user.id, has_used_free_credit: true } as any);
  }
}

export async function deductCredit(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase.rpc("deduct_credit", { p_user_id: user.id });
  if (error) throw new Error("Failed to deduct credit");
  if (data === -1) throw new Error("No credits remaining");
  return data;
}

export async function createCheckoutSession(pack: "starter" | "power"): Promise<string> {
  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: { pack },
  });

  if (error) throw new Error(error.message || "Checkout failed");
  if (data?.error) throw new Error(data.error);
  return data.url;
}
