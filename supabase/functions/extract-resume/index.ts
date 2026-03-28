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

const parseJsonOrText = async (response: Response) => {
  const text = await response.text();
  try {
    return { text, json: JSON.parse(text) };
  } catch {
    return { text, json: null };
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ONEMIN_AI_API_KEY = Deno.env.get("ONEMIN_AI_API_KEY");
    if (!ONEMIN_AI_API_KEY) {
      return jsonResponse(500, { error: "ONEMIN_AI_API_KEY is not configured" });
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

    const maxSize = 20 * 1024 * 1024; // 20MB
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

    // Step 1: Upload file to 1min Asset API
    const fileBuffer = await file.arrayBuffer();
    const uploadForm = new FormData();
    uploadForm.append("asset", new Blob([fileBuffer], { type: file.type || "application/octet-stream" }), file.name || "resume.pdf");

    const uploadResponse = await fetch("https://api.1min.ai/api/assets", {
      method: "POST",
      headers: {
        "API-KEY": ONEMIN_AI_API_KEY,
      },
      body: uploadForm,
    });

    const uploadParsed = await parseJsonOrText(uploadResponse);
    if (!uploadResponse.ok) {
      console.error("1min.AI asset upload error:", uploadResponse.status, uploadParsed.text);

      if (uploadResponse.status === 429) {
        return jsonResponse(429, { error: "Rate limit exceeded. Please try again in a moment." });
      }
      if (uploadResponse.status === 402) {
        return jsonResponse(402, { error: "Insufficient 1min.AI credits." });
      }

      return jsonResponse(500, {
        error: `File extraction failed [${uploadResponse.status}]`,
      });
    }

    const fileId = uploadParsed.json?.fileContent?.uuid;
    const filePath = uploadParsed.json?.fileContent?.path || uploadParsed.json?.asset?.key;

    if (!fileId && !filePath) {
      console.error("1min.AI upload response missing file identifier:", uploadParsed.text);
      return jsonResponse(500, { error: "File upload succeeded but no file identifier was returned." });
    }

    // Step 2: Ask Chat API to OCR/extract text from uploaded file
    const extractPrompt =
      "Extract all text from this resume document exactly as written. Preserve section headings, bullet points, and line breaks. Return plain text only.";

    const extractionAttempts = [
      fileId
        ? {
            type: "UNIFY_CHAT_WITH_AI",
            model: "gpt-4o-mini",
            promptObject: {
              prompt: extractPrompt,
              attachments: {
                files: [fileId],
              },
            },
          }
        : null,
      filePath && isImage
        ? {
            type: "UNIFY_CHAT_WITH_AI",
            model: "gpt-4o-mini",
            promptObject: {
              prompt: extractPrompt,
              attachments: {
                images: [filePath],
              },
            },
          }
        : null,
    ].filter(Boolean) as Array<Record<string, unknown>>;

    let lastErrorStatus = 500;
    let lastErrorText = "No extraction attempts were made.";

    for (const payload of extractionAttempts) {
      const extractResponse = await fetch("https://api.1min.ai/api/chat-with-ai", {
        method: "POST",
        headers: {
          "API-KEY": ONEMIN_AI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const extractParsed = await parseJsonOrText(extractResponse);

      if (!extractResponse.ok) {
        lastErrorStatus = extractResponse.status;
        lastErrorText = extractParsed.text;
        console.error("1min.AI extraction error:", extractResponse.status, extractParsed.text);
        continue;
      }

      const extractedText =
        extractParsed.json?.aiRecord?.aiRecordDetail?.resultText ||
        extractParsed.json?.result ||
        extractParsed.json?.content ||
        "";

      if (typeof extractedText === "string" && extractedText.trim().length > 0) {
        return jsonResponse(200, { text: extractedText.trim() });
      }
    }

    if (lastErrorStatus === 429) {
      return jsonResponse(429, { error: "Rate limit exceeded. Please try again in a moment." });
    }
    if (lastErrorStatus === 402) {
      return jsonResponse(402, { error: "Insufficient 1min.AI credits." });
    }

    console.error("1min.AI extraction failed after attempts:", lastErrorText);
    return jsonResponse(422, {
      error: "Could not extract text from the file. Try a different file or paste your resume instead.",
    });
  } catch (e) {
    console.error("extract-resume error:", e);
    return jsonResponse(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});
