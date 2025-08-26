"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth, db } from "../../../../firebase/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";

export default function SuccessPage() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("session_id");

  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [status, setStatus] = useState<
    | { type: "loading"; message?: string }
    | { type: "error"; message: string }
    | { type: "done"; message: string; receiptUrl?: string }
  >({ type: "loading", message: "Verifying payment..." });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const canProceed = useMemo(() => Boolean(sessionId && user), [sessionId, user]);

  useEffect(() => {
    const run = async () => {
      if (!sessionId) {
        setStatus({ type: "error", message: "Missing session_id." });
        return;
      }
      // Wait for auth state
      if (!user) return;

      try {
        setStatus({ type: "loading", message: "Fetching session..." });
        const res = await fetch(`/api/get-checkout-session?session_id=${encodeURIComponent(sessionId)}`);
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e?.error || "Failed to fetch session");
        }
        const s = await res.json();

        // Validate payment succeeded
        if (s.payment_status !== "paid" && s.status !== "complete") {
          throw new Error("Payment not completed.");
        }

        // Validate that the session belongs to the signed-in user
        const metaUid = s?.metadata?.firebaseUid;
        if (metaUid && metaUid !== user.uid) {
          throw new Error("This payment does not belong to the current user.");
        }

        const uid = user.uid;

        // Save under users/{uid}/payments/{sessionId}
        const paymentRef = doc(db, "users", uid, "payments", s.id);
        await setDoc(
          paymentRef,
          {
            sessionId: s.id,
            amountTotal: s.amount_total,
            currency: s.currency,
            paymentStatus: s.payment_status,
            plan: s?.metadata?.plan || "pro_one_time",
            paymentIntentId: s.payment_intent_id ?? null,
            receiptUrl: s.receipt_url ?? null,
            customerEmail: s.customer_email ?? null,
            created: s.created ? new Date(s.created * 1000).toISOString() : null,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // Mark user as pro
        const userRef = doc(db, "users", uid);
        await setDoc(
          userRef,
          {
            status: "pro",
            proActivatedAt: serverTimestamp(),
            lastPaymentSessionId: s.id,
          },
          { merge: true }
        );

        setStatus({ type: "done", message: "Payment confirmed! Your Pro access is active.", receiptUrl: s.receipt_url });
      } catch (err: any) {
        setStatus({ type: "error", message: err?.message || "Failed to verify payment." });
      }
    };

    run();
  }, [sessionId, user]);

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="mx-auto max-w-lg text-center">
        {status.type === "loading" && (
          <>
            <h1 className="font-headline text-3xl">Finalizing your upgrade...</h1>
            <p className="mt-4 text-muted-foreground">{status.message || "Please wait."}</p>
          </>
        )}

        {status.type === "error" && (
          <>
            <h1 className="font-headline text-3xl">Payment verification failed</h1>
            <p className="mt-4 text-red-600">{status.message}</p>
            <div className="mt-8 flex justify-center gap-3">
              <Button variant="outline" onClick={() => router.push("/pro")}>Back to Pro</Button>
              <Button onClick={() => router.refresh()}>Try Again</Button>
            </div>
          </>
        )}

        {status.type === "done" && (
          <>
            <h1 className="font-headline text-3xl">You're Pro now 🎉</h1>
            <p className="mt-4 text-muted-foreground">{status.message}</p>
            <div className="mt-8 flex justify-center gap-3">
              {status.receiptUrl && (
                <Button asChild variant="outline">
                  <a href={status.receiptUrl} target="_blank" rel="noreferrer">View receipt</a>
                </Button>
              )}
              <Button onClick={() => router.push("/")}>Go to app</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
