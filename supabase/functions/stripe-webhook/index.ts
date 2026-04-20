import Stripe from "npm:stripe@14";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-04-10",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Webhook signature verification failed:", message);
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id || session.client_reference_id;
        if (!userId) break;

        // Activate Pro plan immediately after successful checkout
        await supabaseAdmin
          .from("profiles")
          .update({
            plan: "pro",
            trial_ends_at: null,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq("id", userId);

        console.log(`Activated Pro for user ${userId}`);
        break;
      }

      case "customer.subscription.deleted": {
        // Subscription cancelled or expired → downgrade to free
        const subscription = event.data.object as Stripe.Subscription;
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("stripe_subscription_id", subscription.id);

        if (profiles && profiles.length > 0) {
          await supabaseAdmin
            .from("profiles")
            .update({ plan: "free", stripe_subscription_id: null })
            .eq("stripe_subscription_id", subscription.id);

          console.log(`Downgraded user ${profiles[0].id} to free (sub cancelled)`);
        }
        break;
      }

      case "invoice.payment_failed": {
        // Payment failed — optionally notify user or add grace period
        const invoice = event.data.object as Stripe.Invoice;
        console.warn(`Payment failed for subscription ${invoice.subscription}`);
        break;
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Error handling webhook event:", message);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
