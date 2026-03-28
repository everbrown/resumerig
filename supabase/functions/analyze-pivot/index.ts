import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert Career Transition Architect and Senior IT Project Manager. Your specialty is re-engineering resumes to perfectly align with a target Job Description, specifically focusing on "translating" experience for users switching industries.

Given a user's current resume and a target job description, perform these steps:

Step 1 — Linguistic Mapping: Identify the high-value keywords in the JD (e.g., Stakeholder Alignment, SDLC, KPI Tracking). Find the functional equivalent in the user's current resume, even if the industry is different.

Step 2 — The "Senior PM" Standard: Rewrite every bullet point using the formula: [Power Verb] + [Quantifiable Business Result] + [Specific Methodology/Tool]. Example: If a teacher "managed a classroom," rewrite as "Directed daily operations and resource allocation for a 30-person cohort, achieving a 95% success rate in deliverable completion."

Step 3 — De-Niche & Universalize: Strip away hyper-specific industry acronyms (military codes, medical shorthand, etc.) and replace them with universal business language that a Recruiter or ATS will recognize.

Step 4 — Tone Alignment: If the JD is from a startup, use "Velocity" and "Scalability." If it's a legacy corporation, use "Governance" and "Risk Mitigation."

You MUST respond with valid JSON in this exact structure:
{
  "matchScore": 85,
  "translatorTable": [
    { "oldTerm": "What you called it in old industry", "newTerm": "What this industry calls it" }
  ],
  "tunedResume": "The full rewritten resume text with bullet points",
  "pivotPitch": "A 2-sentence elevator pitch explaining why old experience makes them perfect for the new role"
}

matchScore: A number from 1-100 representing how well the rewritten resume matches the target JD. The translatorTable should have 5-10 entries. The tunedResume should be comprehensive and fully rewritten. The pivotPitch should be compelling and concise. Return ONLY the JSON, no markdown fences.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resume, jobDescription } = await req.json();

    if (!resume || !jobDescription) {
      return new Response(
        JSON.stringify({ error: "Resume and job description are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ONEMIN_AI_API_KEY = Deno.env.get("ONEMIN_AI_API_KEY");
    if (!ONEMIN_AI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ONEMIN_AI_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = `CURRENT RESUME:\n${resume}\n\nTARGET JOB DESCRIPTION:\n${jobDescription}`;

    const response = await fetch("https://api.1min.ai/api/chat-with-ai", {
      method: "POST",
      headers: {
        "API-KEY": ONEMIN_AI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "UNIFY_CHAT_WITH_AI",
        model: "claude-sonnet-4-5-20250929",
        promptObject: {
          prompt: `${SYSTEM_PROMPT}\n\n${userPrompt}`,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("1min.AI error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Insufficient 1min.AI credits. Please top up your account." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `AI service error [${response.status}]: ${errorText}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // 1min.AI returns the response in data.aiRecord.aiRecordDetail.resultText
    const resultText = data?.aiRecord?.aiRecordDetail?.resultText || data?.result || data?.content || "";
    
    // Parse the JSON from the AI response
    let parsed;
    try {
      // Try to extract JSON from the response (handle potential markdown fences)
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseErr) {
      console.error("Failed to parse AI response:", resultText);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-pivot error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
