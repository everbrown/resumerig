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

IMPORTANT: You MUST respond by calling the provided function tool. Do NOT return plain text.`;

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = `CURRENT RESUME:\n${resume}\n\nTARGET JOB DESCRIPTION:\n${jobDescription}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_analysis",
              description: "Return the career pivot analysis result",
              parameters: {
                type: "object",
                properties: {
                  beforeScore: { type: "number", description: "Score 1-100 of original resume match" },
                  afterScore: { type: "number", description: "Score 1-100 of rewritten resume match" },
                  translatorTable: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        oldTerm: { type: "string" },
                        newTerm: { type: "string" },
                      },
                      required: ["oldTerm", "newTerm"],
                      additionalProperties: false,
                    },
                    description: "5-10 term translations from old to new industry language",
                  },
                  originalBullets: {
                    type: "array",
                    items: { type: "string" },
                    description: "5-8 original bullet points from resume",
                  },
                  tunedBullets: {
                    type: "array",
                    items: { type: "string" },
                    description: "Rewritten bullets matching originalBullets 1:1",
                  },
                  tunedResume: { type: "string", description: "Full rewritten resume text" },
                  pivotPitch: { type: "string", description: "2-sentence elevator pitch" },
                },
                required: ["beforeScore", "afterScore", "translatorTable", "originalBullets", "tunedBullets", "tunedResume", "pivotPitch"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_analysis" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `AI service error [${response.status}]` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    // Extract structured output from tool call
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Failed to get structured response from AI. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(toolCall.function.arguments);

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
