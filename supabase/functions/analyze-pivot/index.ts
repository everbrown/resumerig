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

CRITICAL RULES:
- NEVER change employer/company names, school/university names, degree names (e.g. "B.S. in Biology", "MBA"), dates of employment, graduation dates, or personal details (name, contact info, address, phone, email).
- Only rewrite bullet points, skills descriptions, and summary/objective sections.
- The tunedResume must keep every original workplace, institution, degree, certification, and date exactly as they appear in the source resume.
- You MAY suggest improved job titles that better align with the target JD's language. When suggesting titles, FIRST identify the exact target role title from the Job Description (e.g. "Resource Deployment Manager") and use that as the primary basis for suggestions. Suggested titles should bridge the user's experience toward that specific target role, not generic industry titles. When you do, return the original and suggested title in the titleChanges array. In the tunedResume text itself, use the ORIGINAL title — the UI will handle displaying both.

FORMATTING RULES FOR tunedResume:
- Use clear section headings in ALL CAPS on their own line (e.g. SUMMARY, EXPERIENCE, EDUCATION, SKILLS, CERTIFICATIONS).
- Add a blank line before each section heading.
- For each job entry, put the job title, company, location, AND dates on the SAME line, separated by " | " (pipe). Example: "Senior Project Manager | Acme Corp, New York, NY | Jan 2020 - Present"
- For each education entry, put the degree, school, AND date on the SAME line, separated by " | ". Example: "B.S. Computer Science | MIT | May 2019"
- Start each bullet point with "• " (bullet character + space).
- Group bullets directly under their parent job/education entry with no blank lines between bullets.
- Add a blank line between different job entries or education entries.
- NEVER list dates on separate lines disconnected from their related job or school.

IMPORTANT: You MUST respond by calling the provided function tool. Do NOT return plain text.`;

const normalizeForMatch = (value: string) =>
  value
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^a-z0-9|\-\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const isBulletLine = (line: string) => /^\s*(?:[-*•▪●]|\d+[.)])\s+/.test(line);

const normalizeHeading = (line: string) => line.trim().toUpperCase().replace(/[:\s]+$/g, "");

const isExperienceHeading = (line: string) => {
  const h = normalizeHeading(line);
  return ["EXPERIENCE", "PROFESSIONAL EXPERIENCE", "WORK EXPERIENCE", "EMPLOYMENT HISTORY", "RELEVANT EXPERIENCE"].includes(h);
};

const isEducationHeading = (line: string) => {
  const h = normalizeHeading(line);
  return ["EDUCATION", "ACADEMIC BACKGROUND", "EDUCATIONAL BACKGROUND", "ACADEMICS"].includes(h);
};

type IdentityLine = { index: number; text: string };

const collectIdentityLines = (text: string) => {
  const lines = text.split("\n");
  const header: IdentityLine[] = [];
  const experience: IdentityLine[] = [];
  const education: IdentityLine[] = [];

  let section: "header" | "experience" | "education" | "other" = "header";
  let seenMainSection = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (isExperienceHeading(trimmed)) {
      section = "experience";
      seenMainSection = true;
      return;
    }

    if (isEducationHeading(trimmed)) {
      section = "education";
      seenMainSection = true;
      return;
    }

    if (/^[A-Z][A-Z\s/&-]{2,}$/.test(trimmed) && trimmed.length <= 45) {
      section = "other";
      seenMainSection = true;
      return;
    }

    if (isBulletLine(trimmed)) return;

    if (!seenMainSection && section === "header") {
      header.push({ index, text: line });
      return;
    }

    if (section === "experience") {
      experience.push({ index, text: line });
      return;
    }

    if (section === "education") {
      education.push({ index, text: line });
    }
  });

  return { lines, header, experience, education };
};

const extractTitleFromExperienceLine = (line: string) => {
  const trimmed = line.trim();
  if (!trimmed) return "";
  if (trimmed.includes("|")) {
    return trimmed.split("|")[0].trim();
  }
  return trimmed.length <= 90 ? trimmed : "";
};

const lockImmutableIdentityLines = (sourceResume: string, generatedResume: string) => {
  const source = collectIdentityLines(sourceResume);
  const generated = collectIdentityLines(generatedResume);
  const generatedLines = [...generated.lines];

  const applyGroup = (sourceGroup: IdentityLine[], generatedGroup: IdentityLine[]) => {
    const limit = Math.min(sourceGroup.length, generatedGroup.length);
    for (let i = 0; i < limit; i++) {
      if (normalizeForMatch(sourceGroup[i].text) !== normalizeForMatch(generatedGroup[i].text)) {
        generatedLines[generatedGroup[i].index] = sourceGroup[i].text;
      }
    }
  };

  applyGroup(source.header, generated.header);
  applyGroup(source.experience, generated.experience);
  applyGroup(source.education, generated.education);

  const sourceTitles = source.experience
    .map((item) => extractTitleFromExperienceLine(item.text))
    .filter(Boolean);

  return {
    tunedResume: generatedLines.join("\n"),
    sourceTitles,
  };
};

const sanitizeTitleChanges = (titleChanges: unknown, sourceTitles: string[]) => {
  if (!Array.isArray(titleChanges)) return [];

  return titleChanges
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const originalRaw = typeof (item as any).originalTitle === "string" ? (item as any).originalTitle.trim() : "";
      const suggested = typeof (item as any).suggestedTitle === "string" ? (item as any).suggestedTitle.trim() : "";
      const original = sourceTitles[index] || originalRaw;

      if (!original || !suggested) return null;
      if (normalizeForMatch(original) === normalizeForMatch(suggested)) return null;

      return {
        originalTitle: original,
        suggestedTitle: suggested,
      };
    })
    .filter(Boolean);
};

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
        max_tokens: 16384,
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
                  tunedResume: { type: "string", description: "Full rewritten resume text with EVERY section, job entry, and bullet point included. Do NOT truncate or abbreviate. Keep original job titles, company names, schools, degrees, and dates unchanged." },
                  pivotPitch: { type: "string", description: "2-sentence elevator pitch" },
                  titleChanges: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        originalTitle: { type: "string", description: "The exact job title from the original resume" },
                        suggestedTitle: { type: "string", description: "The suggested industry-aligned title" },
                      },
                      required: ["originalTitle", "suggestedTitle"],
                      additionalProperties: false,
                    },
                    description: "List of job titles where a more industry-aligned alternative is suggested. Can be empty if no changes needed.",
                  },
                },
                required: ["beforeScore", "afterScore", "translatorTable", "originalBullets", "tunedBullets", "tunedResume", "pivotPitch", "titleChanges"],
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

    // Check for truncation
    const finishReason = data?.choices?.[0]?.finish_reason;
    if (finishReason === "length") {
      console.error("Response was truncated due to token limit");
      return new Response(
        JSON.stringify({ error: "Your resume is very detailed — the analysis was cut short. Please try again or shorten your resume slightly." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract structured output from tool call
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Failed to get structured response from AI. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (parseErr) {
      console.error("Failed to parse tool call arguments (likely truncated):", toolCall.function.arguments?.slice(-200));
      return new Response(
        JSON.stringify({ error: "The AI response was incomplete. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof parsed?.tunedResume === "string") {
      const { tunedResume, sourceTitles } = lockImmutableIdentityLines(resume, parsed.tunedResume);
      parsed.tunedResume = tunedResume;
      parsed.titleChanges = sanitizeTitleChanges(parsed.titleChanges, sourceTitles);
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
