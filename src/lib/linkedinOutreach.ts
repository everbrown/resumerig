import { supabase } from "@/integrations/supabase/client";

export interface OutreachLead {
  type: "hiring_manager" | "peer" | "recruiter";
  title: string;
  confidence: number;
  reasoning: string;
  outreachMessage: string;
  messageType: "Direct Pivot Pitch" | "Insight Request" | "Gatekeeper Pitch";
  subjectLine: string;
}

export interface OutreachResult {
  companyName: string;
  department: string;
  leads: OutreachLead[];
  strategy: string;
}

export async function generateOutreach(
  tunedResume: string,
  jobDescription: string,
  pivotPitch: string
): Promise<OutreachResult> {
  const { data, error } = await supabase.functions.invoke("linkedin-outreach", {
    body: { tunedResume, jobDescription, pivotPitch },
  });

  if (error) {
    console.error("Edge function error:", error);
    throw new Error(error.message || "Outreach generation failed");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as OutreachResult;
}

export async function getCreditBalance(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 5; // Default for unauthenticated

  const { data, error } = await supabase
    .from("credit_balances")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return 5; // Default balance
  return data.balance;
}
