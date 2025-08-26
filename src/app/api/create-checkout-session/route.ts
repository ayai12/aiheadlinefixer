import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      return new Response(JSON.stringify({ error: "Missing STRIPE_SECRET_KEY in environment" }), { status: 500 });
    }
    const stripe = new Stripe(stripeSecret, { apiVersion: "2025-07-30.basil" });

    const { uid, email } = await req.json().catch(() => ({ uid: undefined, email: undefined }));

    const origin = req.headers.get("origin") || req.headers.get("x-forwarded-host") || "";
    const baseUrl = origin.startsWith("http") ? origin : (origin ? `https://${origin}` : "http://localhost:9002");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // If you have a Price ID in Stripe, prefer using line_items: [{ price: "price_...", quantity: 1 }]
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: 1900, // $19.00
            product_data: {
              name: "Pro Bundle",
              description: "One-time purchase for lifetime access to Pro features",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/pro/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pro?canceled=1`,
      customer_email: email,
      metadata: {
        firebaseUid: uid || "",
        firebaseEmail: email || "",
        plan: "pro_one_time",
      },
    });

    return new Response(JSON.stringify({ id: session.id }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    console.error("/api/create-checkout-session error", err);
    return new Response(JSON.stringify({ error: err?.message || "Failed to create session" }), { status: 500 });
  }
}
