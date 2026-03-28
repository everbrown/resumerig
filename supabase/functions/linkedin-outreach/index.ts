import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert LinkedIn Outreach Strategist and Talent Intelligence Analyst. Given a tuned resume, the original job description, and a pivot pitch, your job is to identify the most likely hiring decision-makers and generate personalized outreach messages.

You MUST respond with valid JSON in this exact structure:
{
  "companyName": "The company name from the JD",
  "department": "The department/team the role belongs to",
  "leads": [
    {
      "type": "hiring_manager" | "peer" | "recruiter",
      "title": "Their likely job title (e.g. 'Engineering Director')",
      "confidence": 85,
      "reasoning": "Why this person type is relevant",
      "outreachMessage": "The full personalized LinkedIn message (150-300 words)",
      "messageType": "Direct Pivot Pitch" | "Insight Request" | "Gatekeeper Pitch",
      "subjectLine": "A compelling connection request note (max 200 chars)"
    }
  ],
  "strategy": "A 2-sentence summary of the recommended outreach order and timing"
}

Rules for generating leads:
1. ALWAYS generate exactly 3 leads in this order:
   - Lead 1 (hiring_manager): The most likely direct hiring manager. Confidence 70-95. Generate a "Direct Pivot Pitch" that explains how the candidate's cross-industry experience solves this manager's department goals.
   - Lead 2 (peer): Someone currently in or recently transitioned into the target role. Confidence 60-80. Generate an "Insight Request" — a warm, curiosity-driven message asking about their career transition.
   - Lead 3 (recruiter): The internal Talent Acquisition / Technical Recruiter for this department. Confidence 50-75. Generate a "Gatekeeper Pitch" highlighting ATS-friendly keywords and transferable skills.

2. Messages must be personalized using details from the tuned resume and pivot pitch.
3. Messages should feel human, not templated. Use specific details from the JD.
4. Each message should have a clear call-to-action.
5. The subjectLine should be compelling enough to get the connection accepted.

Return ONLY the JSON, no markdown fences.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tunedResume, jobDescription, pivotPitch } = await req.json();

    if (!tunedResume || !jobDescription || !pivotPitch) {
      return new Response(
        JSON.stringify({ error: "Tuned resume, job description, and pivot pitch are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check credits via auth
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (user) {
        const { data: creditResult, error: creditError } = await supabase.rpc("deduct_credit", {
          p_user_id: user.id,
        });

        if (creditError) {
          console.error("Credit deduction error:", creditError);
        }

        if (creditResult === -1) {
          return new Response(
            JSON.stringify({ error: "Insufficient Career Credits. You need at least 1 credit for outreach generation." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    const ONEMIN_AI_API_KEY = Deno.env.get("ONEMIN_AI_API_KEY");
    if (!ONEMIN_AI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ONEMIN_AI_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = `TUNED RESUME:\n${tunedResume}\n\nTARGET JOB DESCRIPTION:\n${jobDescription}\n\nPIVOT PITCH:\n${pivotPitch}`;

    const response = await fetch("https://api.1min.ai/api/chat-with-ai", {
      method: "POST",
      headers: {
        "API-KEY": ONEMIN_AI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "UNIFY_CHAT_WITH_AI",
        model: "claude-3-5-sonnet-20241022",
        promptObject: {
          prompt: `${SYSTEM_PROMPT}\n\n${userPrompt}`,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("1min.AI error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `AI service error [${response.status}]` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const resultText = data?.aiRecord?.aiRecordDetail?.resultText || data?.result || data?.content || "";

    let parsed;
    try {
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
    console.error("linkedin-outreach error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
