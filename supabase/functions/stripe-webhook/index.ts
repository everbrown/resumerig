import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const credits = parseInt(session.metadata?.credits || "0", 10);
    const alreadyFulfilled = session.metadata?.fulfilled === "true";

    if (userId && credits > 0 && !alreadyFulfilled) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Upsert credit balance
      const { data: existing } = await supabaseAdmin
        .from("credit_balances")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        await supabaseAdmin
          .from("credit_balances")
          .update({ balance: existing.balance + credits, updated_at: new Date().toISOString() })
          .eq("user_id", userId);
      } else {
        await supabaseAdmin
          .from("credit_balances")
          .insert({ user_id: userId, balance: credits, has_used_free_credit: true });
      }

      await stripe.checkout.sessions.update(session.id, {
        metadata: {
          ...(session.metadata ?? {}),
          fulfilled: "true",
          fulfilled_at: new Date().toISOString(),
        },
      });

      // Fulfill referral bonus if applicable
      await supabaseAdmin.rpc("fulfill_referral_bonus", { p_user_id: userId });

      console.log(`Added ${credits} credits for user ${userId}`);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
