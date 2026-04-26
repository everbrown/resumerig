import { supabase } from "@/integrations/supabase/client";

export interface CreditStatus {
  hasUsedFreeCredit: boolean;
  balance: number;
  isAuthenticated: boolean;
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
  const passExpiresAt: string | null = row?.pass_expires_at ?? null;
  const hasActivePass = passExpiresAt ? new Date(passExpiresAt).getTime() > Date.now() : false;
  return {
    hasUsedFreeCredit: row?.has_used_free_credit ?? false,
    balance: row?.balance ?? 0,
    isAuthenticated,
    passExpiresAt,
    exportsRemaining: row?.exports_remaining ?? 0,
    hasActivePass,
  };
}

export async function getCreditStatus(): Promise<CreditStatus> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ...EMPTY };

  const { data } = await supabase
    .from("credit_balances")
    .select("balance, has_used_free_credit, pass_expires_at, exports_remaining")
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
      pass_expires_at: data?.passExpiresAt ?? null,
      exports_remaining: Number(data?.exportsRemaining ?? 0),
    },
    true
  );
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

/**
 * Attempts to deduct/charge an alignment.
 * Returns: -1 = no access, 9999 = unlimited pass, N = balance after deduction.
 */
export async function deductCredit(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase.rpc("deduct_credit", { p_user_id: user.id });
  if (error) throw new Error("Failed to deduct credit");
  if (data === -1) throw new Error("No access — purchase the Bypass Fee to continue");
  return data as number;
}

/**
 * Consumes one export quota. Returns remaining exports, or -1 if none.
 */
export async function consumeExport(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase.rpc("consume_export" as any, { p_user_id: user.id });
  if (error) throw new Error("Failed to consume export");
  return Number(data);
}

export async function createCheckoutSession(pack: "bypass" = "bypass"): Promise<string> {
  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: { pack },
  });

  if (error) throw new Error(error.message || "Checkout failed");
  if (data?.error) throw new Error(data.error);
  return data.url;
}
