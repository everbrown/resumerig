import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getDocument } from "npm:pdfjs-dist@4.10.38/legacy/build/pdf.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SECTION_HEADINGS = new Set([
  "SUMMARY", "PROFESSIONAL SUMMARY", "OBJECTIVE",
  "EXPERIENCE", "PROFESSIONAL EXPERIENCE", "WORK EXPERIENCE", "EMPLOYMENT HISTORY", "RELEVANT EXPERIENCE",
  "EDUCATION", "ACADEMIC BACKGROUND", "EDUCATIONAL BACKGROUND",
  "SKILLS", "TECHNICAL SKILLS", "CORE COMPETENCIES", "KEY SKILLS",
  "CERTIFICATIONS", "CERTIFICATES", "LICENSES",
  "PROJECTS", "AWARDS", "VOLUNTEER", "PUBLICATIONS", "INTERESTS",
]);

const isHeading = (line: string) => {
  const trimmed = line.trim().toUpperCase().replace(/[:\s]+$/g, "");
  return SECTION_HEADINGS.has(trimmed) || (/^[A-Z][A-Z\s/&-]{2,}$/.test(trimmed) && trimmed.length <= 45);
};

const isBullet = (line: string) => /^\s*(?:[-*•▪●]|\d+[.)])\s+/.test(line);

const isEntryLine = (line: string) => {
  const trimmed = line.trim();
  if (trimmed.includes("|") && trimmed.length > 10) return true;
  if (/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s+\d{4}/i.test(trimmed)) return true;
  if (/\b\d{4}\s*[-–—]\s*(?:\d{4}|present|current)\b/i.test(trimmed)) return true;
  return false;
};

const normalizeLineText = (line: string) =>
  line
    .replace(/[\u00A0\t]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();

const shouldMergeWithPrevious = (line: string, previousLine: string) => {
  if (!previousLine) return false;
  if (!line) return false;
  if (isHeading(line) || isBullet(line) || isEntryLine(line)) return false;
  if (isHeading(previousLine)) return false;

  const startsLikeContinuation = /^[a-z(]/.test(line);
  const previousLooksOpen = !/[.!?:]$/.test(previousLine);
  const previousIsBulletOrEntry = isBullet(previousLine) || isEntryLine(previousLine);

  return startsLikeContinuation || previousLooksOpen || previousIsBulletOrEntry;
};

const repairExtractedText = (rawText: string) => {
  const rawLines = rawText
    .split(/\r?\n/)
    .map(normalizeLineText)
    .filter((line, index, lines) => !(line === "" && lines[index - 1] === ""));

  const repaired = rawLines.reduce<string[]>((acc, line) => {
    if (!line) {
      if (acc[acc.length - 1] !== "") acc.push("");
      return acc;
    }

    const previousLine = acc[acc.length - 1] ?? "";
    if (!acc.length || previousLine === "") {
      acc.push(line);
      return acc;
    }

    if (shouldMergeWithPrevious(line, previousLine)) {
      acc[acc.length - 1] = normalizeLineText(`${previousLine} ${line}`);
      return acc;
    }

    acc.push(line);
    return acc;
  }, []);

  return repaired.join("\n").trim();
};

const extractPdfText = async (fileBuffer: ArrayBuffer) => {
  const pdf = await getDocument({ data: new Uint8Array(fileBuffer), useSystemFonts: true }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const rows = new Map<number, { x: number; text: string }[]>();

    for (const item of content.items as Array<{ str?: string; transform?: number[] }>) {
      const text = normalizeLineText(item?.str ?? "");
      if (!text) continue;

      const x = Math.round(item?.transform?.[4] ?? 0);
      const y = Math.round(item?.transform?.[5] ?? 0);
      const existing = rows.get(y) ?? [];
      existing.push({ x, text });
      rows.set(y, existing);
    }

    const pageLines = [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, tokens]) => normalizeLineText(tokens.sort((a, b) => a.x - b.x).map((token) => token.text).join(" ")))
      .filter(Boolean);

    if (pageLines.length > 0) {
      pages.push(pageLines.join("\n"));
    }
  }

  return repairExtractedText(pages.join("\n\n"));
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return jsonResponse(500, { error: "LOVABLE_API_KEY is not configured" });
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return jsonResponse(400, { error: "Missing content type" });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return jsonResponse(400, { error: "No file provided" });
    }

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return jsonResponse(400, { error: "File too large. Maximum size is 20MB." });
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImage = file.type.startsWith("image/");
    const isDoc =
      file.type.includes("word") ||
      file.name.toLowerCase().endsWith(".docx") ||
      file.name.toLowerCase().endsWith(".doc");

    if (!isPdf && !isImage && !isDoc) {
      return jsonResponse(400, {
        error: "Unsupported file type. Please upload a PDF, image, or Word document.",
      });
    }

    const fileBuffer = await file.arrayBuffer();

    if (isPdf) {
      try {
        const extractedPdfText = await extractPdfText(fileBuffer);
        if (extractedPdfText.trim().length >= 40) {
          return jsonResponse(200, { text: extractedPdfText });
        }
      } catch (pdfError) {
        console.error("Deterministic PDF extraction failed, falling back to AI:", pdfError);
      }
    }

    const base64 = btoa(
      new Uint8Array(fileBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    let mimeType = file.type || "application/octet-stream";
    if (isPdf && !mimeType.includes("pdf")) mimeType = "application/pdf";
    if (isDoc && !mimeType.includes("word")) mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    const extractPrompt = `You are extracting text from a resume document. Follow these instructions carefully:

STEP 1 — VISUAL LAYOUT ANALYSIS:
Before extracting any text, study the VISUAL layout of the document. Pay attention to:
- Column structure: many resumes use two columns or have right-aligned dates
- Line boundaries: text that appears on the SAME visual row belongs together, even if rendered in separate text boxes
- Bullet points: each bullet "•" or "–" starts a NEW, self-contained statement
- Words that are visually part of the same line must NEVER be split across output lines

STEP 2 — EXTRACTION RULES:
- For each job/position entry, combine the job title, company name, location, AND dates onto ONE line separated by " | ". Example: "Senior Project Manager | Acme Corp, New York, NY | Jan 2020 - Present"
- For each education entry, combine degree, school, AND date onto ONE line separated by " | ". Example: "B.S. in Biology | State University | May 2019"
- NEVER put dates on their own separate line. Dates MUST stay attached to the job or education entry they belong to.
- If dates appear in a right-aligned column on the same row as a job title, merge them onto one line.
- Each bullet point must be a COMPLETE, self-contained sentence or phrase. NEVER truncate or split a bullet across multiple lines.
- Preserve all bullet points exactly as written (use "• " prefix).
- Preserve section headings (EXPERIENCE, EDUCATION, SKILLS, etc.).

STEP 3 — CORRUPTION PREVENTION:
- NEVER truncate the beginning of a word. If you see text like "viceNow" it should be "ServiceNow". If you see "tors" it should be "contractors". Always output complete words.
- NEVER merge two separate bullet points into one line. Each bullet is independent.
- If a bullet point wraps to a second visual line, combine it into ONE complete bullet in the output.
- Do NOT paraphrase, normalize, spell-correct, or expand abbreviations.
- Do NOT invent or reorder information.
- Return plain text only.`;

    const userContent: any[] = [
      {
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${base64}`,
        },
      },
      {
        type: "text",
        text: extractPrompt,
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: userContent,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return jsonResponse(429, { error: "Rate limit exceeded. Please try again in a moment." });
      }
      if (response.status === 402) {
        return jsonResponse(402, { error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." });
      }

      return jsonResponse(500, { error: `File extraction failed [${response.status}]` });
    }

    const data = await response.json();
    const extractedText = data?.choices?.[0]?.message?.content;

    if (!extractedText || typeof extractedText !== "string" || extractedText.trim().length < 10) {
      console.error("Empty extraction result:", JSON.stringify(data));
      return jsonResponse(422, {
        error: "Could not extract text from the file. Try a different file or paste your resume instead.",
      });
    }

    return jsonResponse(200, { text: extractedText.trim() });
  } catch (e) {
    console.error("extract-resume error:", e);
    return jsonResponse(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});
