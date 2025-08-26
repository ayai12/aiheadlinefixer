"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../firebase/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        setProfile(snap.exists() ? snap.data() : null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchPayments = async () => {
      setPaymentsLoading(true);
      if (!user) {
        setPayments([]);
        setPaymentsLoading(false);
        return;
      }
      try {
        const colRef = collection(db, "users", user.uid, "payments");
        const snap = await getDocs(colRef);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const getTime = (v: any) => {
          if (!v) return 0;
          if (typeof v === "string") return Date.parse(v) || 0;
          if (typeof v === "number") return v;
          if (v?.seconds) return v.seconds * 1000;
          try { if (typeof v.toDate === "function") return v.toDate().getTime(); } catch {}
          return 0;
        };
        list.sort((a: any, b: any) => getTime(b.created) - getTime(a.created));
        setPayments(list);
      } finally {
        setPaymentsLoading(false);
      }
    };
    fetchPayments();
  }, [user]);

  if (loading) {
    return (
      <div className="container py-12">
        <p>Loading profile…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-12">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">You're not signed in</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/" >Go back</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="text-lg">{user.displayName || profile?.displayName || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-lg">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">UID</p>
            <p className="text-xs break-all">{user.uid}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="flex items-center justify-between">
              <p className="text-lg capitalize">{profile?.status || "free"}</p>
              {profile?.status !== "pro" && (
                <Button asChild size="sm" variant="default">
                  <Link href="/pro">Upgrade to Pro</Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-xl">Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <p>Loading payments…</p>
            ) : payments.length === 0 ? (
              <p className="text-muted-foreground">No payments found.</p>
            ) : (
              <ul className="divide-y">
                {payments.map((p: any) => {
                  const amount = typeof p.amountTotal === "number" ? (p.amountTotal / 100).toFixed(2) : "-";
                  const currency = (p.currency || "").toUpperCase();
                  const created = (() => {
                    if (typeof p.created === "string") return new Date(p.created).toLocaleString();
                    if (p?.seconds) return new Date(p.seconds * 1000).toLocaleString();
                    try { if (p?.toDate) return p.toDate().toLocaleString(); } catch {}
                    return "";
                  })();
                  return (
                    <li key={p.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">Pro Bundle</p>
                        <p className="text-sm text-muted-foreground">{created}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{amount} {currency}</p>
                        <p className="text-xs text-muted-foreground">{p.paymentStatus}</p>
                        {p.receiptUrl && (
                          <Button asChild size="sm" variant="outline" className="mt-1">
                            <a href={p.receiptUrl} target="_blank" rel="noreferrer">View receipt</a>
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
