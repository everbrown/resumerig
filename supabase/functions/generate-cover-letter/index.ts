import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert Cover Letter Writer specializing in career transitions. Given a refined/tuned resume and a target job description, write a compelling, professional cover letter.

RULES:
- Open with a strong hook that demonstrates knowledge of the company/role
- Bridge the candidate's experience to the target domain using the same language translation approach used in the resume
- Highlight 2-3 key achievements that directly map to the JD requirements
- Close with a confident call to action
- Keep it to 3-4 paragraphs, approximately 300-400 words
- Use a professional but warm tone — not robotic
- Do NOT use generic filler phrases like "I am writing to express my interest"
- Reference specific requirements from the JD
- If a pivot pitch is provided, weave its narrative into the letter naturally

Return the cover letter as plain text with proper paragraph breaks.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tunedResume, jobDescription, pivotPitch } = await req.json();

    if (!tunedResume || !jobDescription) {
      return new Response(
        JSON.stringify({ error: "Resume and job description are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = `REFINED RESUME:\n${tunedResume}\n\nTARGET JOB DESCRIPTION:\n${jobDescription}${pivotPitch ? `\n\nPIVOT PITCH:\n${pivotPitch}` : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        max_tokens: 4096,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `AI service error [${response.status}]` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const coverLetter = data?.choices?.[0]?.message?.content;

    if (!coverLetter) {
      return new Response(
        JSON.stringify({ error: "Failed to generate cover letter" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ coverLetter }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-cover-letter error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});