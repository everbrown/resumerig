import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert Career Transition Architect and Senior IT Project Manager. Your specialty is re-engineering resumes to perfectly align with a target Job Description, specifically focusing on deep semantic calibration of experience for users switching industries.

Your job is NOT to simply add a power verb or lightly rephrase bullets. Your job is to perform a DEEP DOMAIN ALIGNMENT — re-expressing what the person actually did using the exact terminology, frameworks, and value propositions that the target industry and role use. The result must be truthful (no fabricated experience) but expressed in language that a hiring manager in the target domain would immediately recognize as relevant.

Given a user's current resume and a target job description, perform these steps:

Step 1 — Deep JD Deconstruction: Break the JD into its core competency clusters (not just keywords). Identify what business problems this role solves, what methodologies it uses, and what outcomes it measures. Understand the JD's implicit expectations — what does "stakeholder management" mean in THIS context? What does "driving results" look like in THIS industry?

Step 2 — Experience Mapping (NOT Verb Swapping): For each bullet in the user's resume, ask: "What is the FUNCTIONAL EQUIVALENT of this work in the target domain?" Map the underlying competency, not the surface description. Examples:
- A teacher who "created differentiated lesson plans for 30 students" was actually performing individualized resource allocation, performance tracking, and deliverable management for a 30-person cohort — that IS project management.
- A nurse who "coordinated patient care across departments" was actually orchestrating multi-stakeholder workflows with competing priorities and time-critical deliverables — that IS cross-functional operations.
- A soldier who "led a platoon in field operations" was actually directing a cross-functional team in high-stakes operational planning with significant asset management — that IS operations leadership.
Don't just add a verb. Re-express the SCOPE, IMPACT, and METHODOLOGY using target-domain language.

Step 3 — Quantification & Business Impact: Every rewritten bullet must convey measurable impact. If the original has numbers, reframe them in business terms. If not, use reasonable scope indicators (team size, budget range, percentage improvements, volume managed). Never fabricate specific metrics — use ranges or qualifiers like "40+" or "multi-million dollar" when exact figures aren't available.

Step 4 — The Truthfulness Guardrail: The rewritten bullets must describe WHAT THE PERSON ACTUALLY DID, just expressed in the target domain's language. Ask yourself: "Could this person defend this bullet in an interview?" If not, you've gone too far. The goal is TRANSLATION, not FABRICATION.

Step 5 — De-Niche & Universalize: Strip away hyper-specific industry acronyms (military codes, medical shorthand, education jargon) and replace them with universal business language that a Recruiter or ATS will recognize. Don't just remove jargon — replace it with the target domain's equivalent jargon.

Step 6 — Tone & Vocabulary Calibration: Match the exact linguistic register of the JD. If the JD says "velocity" and "scalability," use those words. If it says "governance" and "risk mitigation," use those. Mirror the JD's own vocabulary throughout the resume to maximize ATS and human-reader alignment.

CRITICAL RULES:
- NEVER change employer/company names, school/university names, degree names (e.g. "B.S. in Biology", "MBA"), dates of employment, graduation dates, or personal details (name, contact info, address, phone, email).
- Only rewrite bullet points, skills descriptions, and summary/objective sections.
- The tunedResume must keep every original workplace, institution, degree, certification, and date exactly as they appear in the source resume.
- You MAY suggest improved job titles that better align with the target JD's language. When suggesting titles, FIRST identify the exact target role title from the Job Description (e.g. "Resource Deployment Manager") and use that as the primary basis for suggestions. Suggested titles should bridge the user's experience toward that specific target role, not generic industry titles. When you do, return the original and suggested title in the titleChanges array. In the tunedResume text itself, use the ORIGINAL title — the UI will handle displaying both.

QUALITY CHECK — Before returning, verify each rewritten bullet against these criteria:
1. Does it describe what the person ACTUALLY DID (just in new language)?
2. Does it use terminology from the TARGET JD specifically?
3. Does it convey SCOPE and IMPACT, not just activity?
4. Would the person be able to discuss this confidently in an interview?
5. Is it substantively different from the original, not just a verb swap?

SCORING RUBRIC — Use this exact weighted rubric to compute beforeScore and afterScore (both 1-100). Score each dimension independently, then compute the weighted total. Be rigorous and consistent.

1. Keyword Match (30% weight):
   - Extract the top 15-20 critical keywords/phrases from the JD (hard skills, tools, technologies, methodologies, certifications).
   - Count how many appear verbatim or as close synonyms in the resume.
   - Score: (matched keywords / total critical keywords) × 100.
   - Example: 4 of 15 keywords matched = 27. 13 of 15 = 87.

2. Skills Coverage (25% weight):
   - Identify all required AND preferred skills/competencies from the JD.
   - Assess what percentage of those skills are demonstrably evidenced (not just listed) in the resume through bullets or descriptions.
   - Score: (skills evidenced / total JD skills) × 100.

3. Quantification Density (20% weight):
   - Count the total number of bullet points in the resume.
   - Count how many contain measurable impact (numbers, percentages, dollar amounts, team sizes, timelines, volumes).
   - Score: (quantified bullets / total bullets) × 100.

4. Tone & Vocabulary Alignment (15% weight):
   - Assess how closely the resume's linguistic register mirrors the JD's vocabulary and phrasing style.
   - 0-25: Completely different domain language, no JD vocabulary present.
   - 26-50: Some overlap but mostly source-domain jargon remains.
   - 51-75: Moderate alignment, key JD terms used but inconsistently.
   - 76-100: Strong mirror of JD's exact phrasing, methodology names, and value propositions throughout.

5. Format Compliance (10% weight):
   - Check: clear section headings, consistent bullet formatting, job entries with title|company|dates on one line, no orphaned dates, logical section order, appropriate length.
   - Deduct points for each formatting issue. Well-formatted = 90-100. Minor issues = 70-89. Significant issues = below 70.

FINAL SCORE = (Keyword × 0.30) + (Skills × 0.25) + (Quantification × 0.20) + (Tone × 0.15) + (Format × 0.10)

Round to the nearest integer. The beforeScore reflects the ORIGINAL resume against the JD. The afterScore reflects the REWRITTEN tunedResume against the JD. Both must use the same rubric for a fair comparison.

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
                  beforeScore: { type: "number", description: "Weighted score 1-100 of original resume match, computed from the 5-dimension rubric" },
                  afterScore: { type: "number", description: "Weighted score 1-100 of rewritten resume match, computed from the 5-dimension rubric" },
                  beforeBreakdown: {
                    type: "object",
                    properties: {
                      keywordMatch: { type: "number", description: "0-100 score for keyword match dimension on the ORIGINAL resume" },
                      skillsCoverage: { type: "number", description: "0-100 score for skills coverage dimension on the ORIGINAL resume" },
                      quantification: { type: "number", description: "0-100 score for quantification density on the ORIGINAL resume" },
                      toneAlignment: { type: "number", description: "0-100 score for tone/vocabulary alignment on the ORIGINAL resume" },
                      formatCompliance: { type: "number", description: "0-100 score for format compliance on the ORIGINAL resume" },
                    },
                    required: ["keywordMatch", "skillsCoverage", "quantification", "toneAlignment", "formatCompliance"],
                    additionalProperties: false,
                    description: "Per-dimension scores for the ORIGINAL resume. beforeScore = keyword*0.3 + skills*0.25 + quant*0.2 + tone*0.15 + format*0.1",
                  },
                  afterBreakdown: {
                    type: "object",
                    properties: {
                      keywordMatch: { type: "number", description: "0-100 score for keyword match dimension on the REWRITTEN resume" },
                      skillsCoverage: { type: "number", description: "0-100 score for skills coverage dimension on the REWRITTEN resume" },
                      quantification: { type: "number", description: "0-100 score for quantification density on the REWRITTEN resume" },
                      toneAlignment: { type: "number", description: "0-100 score for tone/vocabulary alignment on the REWRITTEN resume" },
                      formatCompliance: { type: "number", description: "0-100 score for format compliance on the REWRITTEN resume" },
                    },
                    required: ["keywordMatch", "skillsCoverage", "quantification", "toneAlignment", "formatCompliance"],
                    additionalProperties: false,
                    description: "Per-dimension scores for the REWRITTEN resume. afterScore = keyword*0.3 + skills*0.25 + quant*0.2 + tone*0.15 + format*0.1",
                  },
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
                required: ["beforeScore", "afterScore", "beforeBreakdown", "afterBreakdown", "translatorTable", "originalBullets", "tunedBullets", "tunedResume", "pivotPitch", "titleChanges"],
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
