import { supabase } from "@/integrations/supabase/client";

export async function generateCoverLetter(
  tunedResume: string,
  jobDescription: string,
  pivotPitch?: string
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("generate-cover-letter", {
    body: { tunedResume, jobDescription, pivotPitch },
  });

  if (error) {
    console.error("Edge function error:", error);
    throw new Error(error.message || "Cover letter generation failed");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data.coverLetter;
}

export async function saveCoverLetter(
  jobDescription: string,
  coverLetter: string,
  resumeHistoryId?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("cover_letters" as any).insert({
    user_id: user.id,
    job_description: jobDescription,
    cover_letter: coverLetter,
    resume_history_id: resumeHistoryId || null,
  } as any);
}