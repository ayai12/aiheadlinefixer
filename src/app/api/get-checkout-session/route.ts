import Stripe from "stripe";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      return new Response(JSON.stringify({ error: "Missing STRIPE_SECRET_KEY in environment" }), { status: 500 });
    }
    const stripe = new Stripe(stripeSecret, { apiVersion: "2025-07-30.basil" });

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Missing session_id" }), { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent", "payment_intent.latest_charge", "payment_intent.charges"],
    });

    // Sanitize response - return only what the client needs
    const pi = session.payment_intent as Stripe.PaymentIntent | null;
    const latestCharge = pi && typeof pi !== "string" ? (pi.latest_charge as Stripe.Charge | null) : null;

    const payload = {
      id: session.id,
      customer_email: session.customer_email,
      status: session.status,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      metadata: session.metadata || {},
      payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : pi?.id,
      receipt_url: latestCharge && typeof latestCharge !== "string" ? latestCharge.receipt_url : undefined,
      created: session.created,
    };

    return new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
  } catch (err: any) {
    console.error("/api/get-checkout-session error", err);
    return new Response(JSON.stringify({ error: err?.message || "Failed to retrieve session" }), { status: 500 });
  }
}
