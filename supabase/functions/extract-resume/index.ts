import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Convert file to base64
    const fileBuffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(fileBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    // Determine MIME type
    let mimeType = file.type || "application/octet-stream";
    if (isPdf && !mimeType.includes("pdf")) mimeType = "application/pdf";
    if (isDoc && !mimeType.includes("word")) mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    const extractPrompt = `First, visually analyze the layout of this resume. Pay close attention to how information is spatially grouped — job titles, company names, locations, and dates often appear on the same visual line or row even if they are in different columns (e.g. left-aligned title with right-aligned dates).

Then extract all text following these rules:
- For each job/position entry, combine the job title, company name, location, AND dates onto ONE line separated by " | ". Example: "Senior Project Manager | Acme Corp, New York, NY | Jan 2020 - Present"
- For each education entry, combine degree, school, AND date onto ONE line separated by " | ". Example: "B.S. in Biology | State University | May 2019"
- NEVER put dates on their own separate line. Dates MUST stay attached to the job or education entry they belong to.
- If dates appear in a right-aligned column on the same row as a job title, merge them onto one line.
- Preserve all bullet points exactly as written (use "• " prefix).
- Preserve section headings (EXPERIENCE, EDUCATION, SKILLS, etc.).
- Do NOT paraphrase, normalize, spell-correct, or expand abbreviations.
- Do NOT invent or reorder information.
- Return plain text only.`;

    // Build multimodal message with base64 file
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
