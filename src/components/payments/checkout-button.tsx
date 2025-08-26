"use client";

import { useCallback, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../../firebase/firebase";
import { Button } from "@/components/ui/button";

export function CheckoutButton() {
  const [loading, setLoading] = useState(false);

  const onClick = useCallback(async () => {
    try {
      setLoading(true);

      let user = auth.currentUser;
      if (!user) {
        // Prompt auth first, then continue to checkout
        const provider = new GoogleAuthProvider();
        const res = await signInWithPopup(auth, provider);
        user = res.user;
      }

      if (!user) throw new Error("Authentication required");

      // Create a Checkout Session
      const token = await user.getIdToken(); // not strictly required for this example, but useful if you add auth-checks server-side later
      const body = { uid: user.uid, email: user.email };
      const createRes = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          // optionally send ID token for server verification in the future
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!createRes.ok) {
        const e = await createRes.json().catch(() => ({}));
        throw new Error(e?.error || "Failed to create session");
      }

      const { id } = await createRes.json();

      // Redirect to Stripe Checkout
      const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!pk) throw new Error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
      const stripe = await loadStripe(pk);
      if (!stripe) throw new Error("Failed to initialize Stripe");

      const { error } = await stripe.redirectToCheckout({ sessionId: id });
      if (error) throw error;
    } catch (err: any) {
      alert(err?.message || "Unable to start checkout");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <Button size="lg" className="w-full" onClick={onClick} disabled={loading} aria-busy={loading}>
      {loading ? "Redirecting..." : "Get Started with Pro"}
    </Button>
  );
}

export default CheckoutButton;
