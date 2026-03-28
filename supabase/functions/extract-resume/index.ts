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

const pickFirstString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
};

const extractTextFromChatApi = (parsed: { text: string; json: any }): string => {
  const { json, text } = parsed;

  const direct = pickFirstString(
    json?.aiRecord?.aiRecordDetail?.resultText,
    json?.result,
    json?.content,
    json?.output_text,
    json?.message,
    json?.data?.text,
    json?.response?.text,
    json?.response?.output_text,
    json?.choices?.[0]?.message?.content,
    json?.choices?.[0]?.delta?.content,
  );

  if (direct) return direct;

  if (Array.isArray(json?.messages)) {
    const joined = json.messages
      .map((m: any) => (typeof m?.content === "string" ? m.content.trim() : ""))
      .filter(Boolean)
      .join("\n");
    if (joined) return joined;
  }

  if (typeof text === "string" && text.includes("data:")) {
    const chunks: string[] = [];
    for (const rawLine of text.split("\n")) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;

      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;

      try {
        const event = JSON.parse(payload);
        const chunk = pickFirstString(
          event?.content,
          event?.text,
          event?.delta,
          event?.choices?.[0]?.delta?.content,
          event?.choices?.[0]?.message?.content,
          event?.aiRecord?.aiRecordDetail?.resultText,
        );
        if (chunk) chunks.push(chunk);
      } catch {
        // Ignore non-JSON SSE lines
      }
    }

    if (chunks.length > 0) {
      return chunks.join("").trim();
    }
  }

  if (typeof text === "string" && text.trim().length > 0 && !text.includes("\"error\"")) {
    return text.trim();
  }

  return "";
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

    const uploadExtractedText =
      typeof uploadParsed.json?.fileContent?.content === "string"
        ? uploadParsed.json.fileContent.content.trim()
        : "";

    if (uploadExtractedText.length > 20) {
      return jsonResponse(200, { text: uploadExtractedText });
    }

    const fileId =
      uploadParsed.json?.fileContent?.uuid ||
      uploadParsed.json?.fileContent?.id ||
      uploadParsed.json?.asset?.uuid ||
      uploadParsed.json?.asset?.id;

    const filePath =
      uploadParsed.json?.fileContent?.path ||
      uploadParsed.json?.asset?.key ||
      uploadParsed.json?.asset?.path;

    if (!fileId && !filePath) {
      console.error("1min.AI upload response missing file identifier:", uploadParsed.text);
      return jsonResponse(500, { error: "File upload succeeded but no file identifier was returned." });
    }

    // Step 2: Ask Chat API to OCR/extract text from uploaded file
    const extractPrompt =
      "Extract all resume text exactly as written. Preserve original company names, university/school names, degree names, dates, headings, bullet points, and line breaks. Do NOT paraphrase, normalize, spell-correct, or expand abbreviations. Return plain text only.";

    const extractionAttempts = [
      fileId
        ? {
            type: "UNIFY_CHAT_WITH_AI",
            model: "claude-sonnet-4-5-20250929",
            promptObject: {
              prompt: extractPrompt,
              attachments: {
                files: [fileId],
              },
            },
          }
        : null,
      filePath
        ? {
            type: "UNIFY_CHAT_WITH_AI",
            model: "claude-sonnet-4-5-20250929",
            promptObject: {
              prompt: extractPrompt,
              attachments: {
                files: [filePath],
              },
            },
          }
        : null,
      filePath && isImage
        ? {
            type: "UNIFY_CHAT_WITH_AI",
            model: "claude-sonnet-4-5-20250929",
            promptObject: {
              prompt: extractPrompt,
              attachments: {
                images: [filePath],
              },
            },
          }
        : null,
    ].filter(Boolean) as Array<Record<string, unknown>>;

    console.log("extract-resume upload refs", {
      fileId: fileId || null,
      filePath: filePath || null,
      attempts: extractionAttempts.length,
      isImage,
    });

    let lastErrorStatus = 500;
    let lastErrorText = "No extraction attempts were made.";

    for (const payload of extractionAttempts) {
      const extractResponse = await fetch("https://api.1min.ai/api/chat-with-ai?isStreaming=false", {
        method: "POST",
        headers: {
          "API-KEY": ONEMIN_AI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const extractParsed = await parseJsonOrText(extractResponse);

      // Detect soft failures: API returns 200 but body indicates an error
      const softFailure =
        extractParsed.json?.aiRecord?.metadata?.status === "FAILURE" ||
        extractParsed.json?.resultObject?.code === "INSUFFICIENT_CREDITS" ||
        extractParsed.json?.status === "FAILURE" ||
        extractParsed.json?.error;

      if (!extractResponse.ok || softFailure) {
        lastErrorStatus = extractResponse.status;
        lastErrorText = extractParsed.text;
        console.error("1min.AI extraction error:", extractResponse.status, extractParsed.text);
        continue;
      }

      const extractedText = extractTextFromChatApi(extractParsed);
      if (extractedText.length > 0) {
        return jsonResponse(200, { text: extractedText });
      }

      lastErrorStatus = extractResponse.status;
      lastErrorText = `Empty extraction content. Raw response: ${extractParsed.text.slice(0, 1200)}`;
      console.error("1min.AI extraction returned empty text:", lastErrorText);
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
