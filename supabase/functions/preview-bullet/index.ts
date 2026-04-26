import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a Career Domain Translator. Given a single resume bullet point and optionally a target role/industry, produce a "Domain Alignment Key" — a table of 3-5 term translations showing how the candidate's existing language maps to the target domain's language.

For each translation:
- "oldTerm": the phrase/concept from the original bullet
- "newTerm": the equivalent phrase a recruiter in the target domain would recognize
- "why": a brief 1-sentence explanation of why this mapping works

Also produce "tunedBullet" — the rewritten version of the bullet using the target domain language. It must be truthful (describe what the person actually did, just in new language).

IMPORTANT: You MUST respond by calling the provided function tool. Do NOT return plain text.`;

// Owner/test accounts — bypass all anti-abuse checks.
const ABUSE_ALLOWLIST = new Set<string>([
  "djcoolmike@gmail.com",
]);

function isAllowlisted(email: unknown): boolean {
  if (typeof email !== "string") return false;
  return ABUSE_ALLOWLIST.has(email.trim().toLowerCase());
}

function getClientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || null;
  }
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bullet, targetRole, fingerprint, email } = await req.json();

    if (!bullet || typeof bullet !== "string" || bullet.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Please provide a bullet point (at least 10 characters)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (bullet.trim().length > 500) {
      return new Response(
        JSON.stringify({ error: "Bullet point too long. Keep it under 500 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const ip = getClientIp(req);
    const fp = typeof fingerprint === "string" && fingerprint.length > 0 ? fingerprint : null;

    // Verify allowlisted email server-side via JWT (don't trust raw body alone).
    let verifiedEmail: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data: userData } = await supabase.auth.getUser(token);
      verifiedEmail = userData.user?.email ?? null;
    }
    const allowlisted = isAllowlisted(verifiedEmail) || isAllowlisted(email);

    // Server-side abuse check (skipped for allowlisted accounts)
    if (!allowlisted) {
      const { data: abuseResult, error: abuseErr } = await supabase.rpc("check_free_trial_abuse", {
        p_fingerprint: fp,
        p_ip: ip,
      });

      if (abuseErr) {
        console.error("abuse check failed:", abuseErr);
      } else if (abuseResult === "fingerprint_exhausted") {
        return new Response(
          JSON.stringify({
            error:
              "This device has reached its free alignment limit. Please upgrade to the Bypass Pack to continue.",
            code: "fingerprint_exhausted",
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else if (abuseResult === "ip_rate_limited") {
        return new Response(
          JSON.stringify({
            error:
              "Free alignment limit reached for your network today. Try again tomorrow or upgrade to the Bypass Pack.",
            code: "ip_rate_limited",
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetContext = targetRole
      ? `\nTarget role/industry: ${targetRole}`
      : "\nTarget: general tech/business domain";

    const userPrompt = `Resume bullet point:\n"${bullet.trim()}"${targetContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        max_tokens: 2048,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_preview",
              description: "Return the bullet point domain alignment preview",
              parameters: {
                type: "object",
                properties: {
                  translations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        oldTerm: { type: "string" },
                        newTerm: { type: "string" },
                        why: { type: "string" },
                      },
                      required: ["oldTerm", "newTerm", "why"],
                      additionalProperties: false,
                    },
                    description: "3-5 term translations from source domain to target domain",
                  },
                  tunedBullet: {
                    type: "string",
                    description: "The rewritten bullet using target domain language",
                  },
                },
                required: ["translations", "tunedBullet"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_preview" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const completion = await response.json();
    const toolCall = completion.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(completion));
      return new Response(
        JSON.stringify({ error: "Failed to generate preview. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Record successful free preview (best-effort). Skip for allowlisted accounts.
    if (!allowlisted) {
      try {
        await supabase.from("abuse_signals").insert({
          fingerprint: fp,
          ip_address: ip,
          signal_type: "free_preview",
        });
      } catch (logErr) {
        console.error("abuse_signals insert failed:", logErr);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("preview-bullet error:", err);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
