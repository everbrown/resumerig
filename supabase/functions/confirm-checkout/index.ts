import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { sessionId } = await req.json();
    if (!sessionId || typeof sessionId !== "string") {
      return new Response(JSON.stringify({ error: "Missing sessionId" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = authData.user;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.metadata?.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "This payment does not belong to the current user" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment has not completed yet" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 409,
      });
    }

    const credits = parseInt(session.metadata?.credits || "0", 10);
    const alreadyFulfilled = session.metadata?.fulfilled === "true";

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (credits > 0 && !alreadyFulfilled) {
      const { data: existing } = await supabaseAdmin
        .from("credit_balances")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabaseAdmin
          .from("credit_balances")
          .update({ balance: existing.balance + credits, updated_at: new Date().toISOString(), has_used_free_credit: true })
          .eq("user_id", user.id);
      } else {
        await supabaseAdmin
          .from("credit_balances")
          .insert({ user_id: user.id, balance: credits, has_used_free_credit: true });
      }

      await stripe.checkout.sessions.update(session.id, {
        metadata: {
          ...(session.metadata ?? {}),
          fulfilled: "true",
          fulfilled_at: new Date().toISOString(),
        },
      });
    }

    // Fulfill referral bonus if applicable
    await supabaseAdmin.rpc("fulfill_referral_bonus", { p_user_id: user.id });

    const { data: balanceRow } = await supabaseAdmin
      .from("credit_balances")
      .select("balance, has_used_free_credit")
      .eq("user_id", user.id)
      .maybeSingle();

    return new Response(JSON.stringify({
      balance: balanceRow?.balance ?? 0,
      hasUsedFreeCredit: balanceRow?.has_used_free_credit ?? false,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Payment confirmation failed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});