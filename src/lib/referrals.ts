import { supabase } from "@/integrations/supabase/client";

export interface ReferralInfo {
  code: string;
  uses: number;
  maxUses: number;
}

export async function getOrCreateReferralCode(): Promise<ReferralInfo | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Check for existing code
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

  // Generate a unique code
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