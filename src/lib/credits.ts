import { supabase } from "@/integrations/supabase/client";

export type PackId = "single" | "five" | "fifteen";

export interface CreditStatus {
  hasUsedFreeCredit: boolean;
  balance: number;
  isAuthenticated: boolean;
  // Deprecated fields kept for backward-compat with existing callers; always defaulted.
  passExpiresAt: string | null;
  exportsRemaining: number;
  hasActivePass: boolean;
}

const EMPTY: CreditStatus = {
  hasUsedFreeCredit: false,
  balance: 0,
  isAuthenticated: false,
  passExpiresAt: null,
  exportsRemaining: 0,
  hasActivePass: false,
};

function buildStatus(row: any, isAuthenticated: boolean): CreditStatus {
  const balance = row?.balance ?? 0;
  return {
    hasUsedFreeCredit: row?.has_used_free_credit ?? false,
    balance,
    isAuthenticated,
    passExpiresAt: null,
    exportsRemaining: balance, // exports now share balance pool
    hasActivePass: false,
  };
}

export async function getCreditStatus(): Promise<CreditStatus> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ...EMPTY };

  const { data } = await supabase
    .from("credit_balances")
    .select("balance, has_used_free_credit")
    .eq("user_id", user.id)
    .maybeSingle();

  return buildStatus(data, true);
}

export async function confirmCheckoutSession(sessionId: string): Promise<CreditStatus> {
  const { data, error } = await supabase.functions.invoke("confirm-checkout", {
    body: { sessionId },
  });

  if (error) throw new Error(error.message || "Payment confirmation failed");
  if (data?.error) throw new Error(data.error);

  return buildStatus(
    {
      balance: Number(data?.balance ?? 0),
      has_used_free_credit: Boolean(data?.hasUsedFreeCredit),
    },
    true
  );
}

export async function markFreeCreditUsed(): Promise<void> {
  // No-op: starter credit is granted as a real balance entry on signup.
  return;
}

/**
 * Deduct 1 credit for a Full Alignment.
 * Returns: -1 = no access, 9999 = unlimited (allowlist), N = balance after deduction.
 */
export async function deductCredit(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase.rpc("deduct_credit", { p_user_id: user.id });
  if (error) throw new Error("Failed to deduct credit");
  if (data === -1) throw new Error("No credits — purchase a Full Alignment pack to continue");
  return data as number;
}

/**
 * Deduct 1 credit for an Export. Returns remaining balance, or -1 if none.
 */
export async function consumeExport(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase.rpc("consume_export" as any, { p_user_id: user.id });
  if (error) throw new Error("Failed to consume export");
  return Number(data);
}

export async function createCheckoutSession(pack: PackId = "single"): Promise<string> {
  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: { pack },
  });

  if (error) throw new Error(error.message || "Checkout failed");
  if (data?.error) throw new Error(data.error);
  return data.url;
}
