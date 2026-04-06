import { supabase } from "@/integrations/supabase/client";

export interface ReferralInfo {
  code: string;
  uses: number;
  maxUses: number;
}

export interface ReferralRedemption {
  id: string;
  status: string;
  created_at: string;
  redeemed_by: string;
}

export async function getOrCreateReferralCode(): Promise<ReferralInfo | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("referral_codes" as any)
    .select("code, uses, max_uses")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return {
      code: (existing as any).code,
      uses: (existing as any).uses,
      maxUses: (existing as any).max_uses,
    };
  }

  const code = `RIG-${user.id.slice(0, 4).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const { data: created, error } = await supabase
    .from("referral_codes" as any)
    .insert({ user_id: user.id, code } as any)
    .select("code, uses, max_uses")
    .single();

  if (error) {
    console.error("Failed to create referral code:", error);
    return null;
  }

  return {
    code: (created as any).code,
    uses: (created as any).uses,
    maxUses: (created as any).max_uses,
  };
}

export async function redeemReferralCode(code: string): Promise<string> {
  const { data, error } = await supabase.rpc("redeem_referral" as any, { p_code: code });
  if (error) throw new Error("Failed to redeem code");
  return data as string;
}

export async function hasRedeemedAnyCode(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("referral_redemptions" as any)
    .select("id")
    .eq("redeemed_by", user.id)
    .maybeSingle();

  return !!data;
}

export async function getReferralRedemptions(): Promise<ReferralRedemption[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get referral codes owned by this user
  const { data: codes } = await supabase
    .from("referral_codes" as any)
    .select("id")
    .eq("user_id", user.id);

  if (!codes || codes.length === 0) return [];

  const codeIds = (codes as any[]).map((c: any) => c.id);

  const { data: redemptions } = await supabase
    .from("referral_redemptions" as any)
    .select("id, status, created_at, redeemed_by")
    .in("referral_code_id", codeIds)
    .order("created_at", { ascending: false });

  return (redemptions as any[] || []).map((r: any) => ({
    id: r.id,
    status: r.status,
    created_at: r.created_at,
    redeemed_by: r.redeemed_by,
  }));
}

export function storeReferralCode(code: string) {
  sessionStorage.setItem("rr_referral_code", code);
}

export function getStoredReferralCode(): string | null {
  return sessionStorage.getItem("rr_referral_code");
}

export function clearStoredReferralCode() {
  sessionStorage.removeItem("rr_referral_code");
}
