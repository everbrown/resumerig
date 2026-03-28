import { supabase } from "@/integrations/supabase/client";

export interface AnalysisResult {
  matchScore: number;
  translatorTable: { oldTerm: string; newTerm: string }[];
  tunedResume: string;
  pivotPitch: string;
}

export async function analyzeCareerPivot(
  resume: string,
  jobDescription: string
): Promise<AnalysisResult> {
  const { data, error } = await supabase.functions.invoke("analyze-pivot", {
    body: { resume, jobDescription },
  });

  if (error) {
    console.error("Edge function error:", error);
    throw new Error(error.message || "Analysis failed");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as AnalysisResult;
}
