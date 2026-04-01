import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert resume editor. Your task is to take an already-refined, domain-aligned resume and condense it into a powerful ONE-PAGE resume.

GOALS:
- The final output must fit on a single printed page (roughly 475–550 words max depending on formatting density).
- Prioritize the most impactful, quantified achievements that align with the target role.
- Maintain professional tone and ATS compatibility.

STRATEGY:
1. SUMMARY: Condense to 2-3 punchy lines max. Lead with years of experience + core domain expertise + 1-2 standout metrics.
2. EXPERIENCE: Keep all job entries (title | company | dates) but ruthlessly trim bullets:
   - Keep only the 2-4 strongest bullets per role (prioritize quantified results, leadership scope, and direct JD alignment).
   - Merge related bullets where possible (e.g., combine two bullets about stakeholder management into one).
   - Remove bullets that are generic or redundant across roles.
   - For older roles (5+ years ago), keep only 1-2 bullets.
3. EDUCATION: One line per entry. Remove descriptions unless they contain honors/GPA.
4. SKILLS: Combine into a single comma-separated line or two. Remove obvious/generic skills.
5. CERTIFICATIONS: Keep only the most relevant 3-4. One line each, no descriptions.
6. Remove any sections that add minimal value (Interests, Volunteer work, Publications) unless directly relevant.

FORMATTING RULES:
- Use ALL CAPS section headings on their own line.
- Job entries: "Title | Company, Location | Dates" on one line.
- Education: "Degree | School | Date" on one line.
- Bullets start with "• ".
- One blank line between sections, no blank lines between bullets.
- Keep original job titles, company names, schools, degrees, and dates EXACTLY as they appear.

IMPORTANT: You MUST respond by calling the provided function tool. Do NOT return plain text.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tunedResume, jobDescription } = await req.json();

    if (!tunedResume) {
      return new Response(
        JSON.stringify({ error: "Aligned resume is required" }),
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

    const userPrompt = `ALIGNED RESUME TO CONDENSE:\n${tunedResume}${jobDescription ? `\n\nTARGET JOB DESCRIPTION (for prioritization context):\n${jobDescription}` : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        max_tokens: 8192,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_condensed_resume",
              description: "Return the condensed one-page resume",
              parameters: {
                type: "object",
                properties: {
                  condensedResume: {
                    type: "string",
                    description: "The full condensed one-page resume text. Must be concise enough to fit on a single printed page.",
                  },
                  removedCount: {
                    type: "number",
                    description: "Number of bullet points removed or merged during condensing.",
                  },
                  summary: {
                    type: "string",
                    description: "Brief 1-sentence explanation of what was trimmed or merged.",
                  },
                },
                required: ["condensedResume", "removedCount", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_condensed_resume" } },
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
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `AI service error [${response.status}]` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Failed to condense resume. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      return new Response(
        JSON.stringify({ error: "AI response was incomplete. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("condense-resume error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});