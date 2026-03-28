import { supabase } from "@/integrations/supabase/client";

export interface TitleChange {
  originalTitle: string;
  suggestedTitle: string;
}

export interface AnalysisResult {
  beforeScore: number;
  afterScore: number;
  translatorTable: { oldTerm: string; newTerm: string }[];
  originalBullets: string[];
  tunedBullets: string[];
  tunedResume: string;
  pivotPitch: string;
  titleChanges?: TitleChange[];
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
