import { supabase } from "@/integrations/supabase/client";
import type { AnalysisResult } from "./analyzeCareerPivot";

export interface ResumeHistoryEntry {
  id: string;
  original_resume: string;
  job_description: string;
  tuned_resume: string;
  pivot_pitch: string | null;
  before_score: number | null;
  after_score: number | null;
  target_role: string | null;
  translator_table: any;
  title_changes: any;
  created_at: string;
}

export async function saveToHistory(
  originalResume: string,
  jobDescription: string,
  result: AnalysisResult,
  targetRole?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("resume_history" as any).insert({
    user_id: user.id,
    original_resume: originalResume,
    job_description: jobDescription,
    tuned_resume: result.tunedResume,
    pivot_pitch: result.pivotPitch,
    before_score: result.beforeScore,
    after_score: result.afterScore,
    target_role: targetRole || null,
    translator_table: result.translatorTable,
    title_changes: result.titleChanges || [],
  } as any);
}

export async function getHistory(): Promise<ResumeHistoryEntry[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("resume_history" as any)
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Failed to fetch history:", error);
    return [];
  }

  return (data || []) as unknown as ResumeHistoryEntry[];
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  await supabase.from("resume_history" as any).delete().eq("id", id);
}