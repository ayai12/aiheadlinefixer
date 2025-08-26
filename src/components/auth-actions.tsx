"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase/firebase";
import { onAuthStateChanged, signOut, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AuthActions() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  // Sign in state
  const [emailIn, setEmailIn] = useState("");
  const [passIn, setPassIn] = useState("");
  const [loadingIn, setLoadingIn] = useState(false);
  const [errorIn, setErrorIn] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Sign up state
  const [nameUp, setNameUp] = useState("");
  const [emailUp, setEmailUp] = useState("");
  const [passUp, setPassUp] = useState("");
  const [loadingUp, setLoadingUp] = useState(false);
  const [errorUp, setErrorUp] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // Upsert user doc with status 'free'
  const upsertUserDoc = async (u: User) => {
    const uid = u.uid;
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid,
        email: u.email ?? null,
        displayName: u.displayName ?? null,
        photoURL: (u as any).photoURL ?? null,
        status: 'free',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (!snap.data()?.status) {
      await setDoc(ref, { status: 'free', updatedAt: serverTimestamp() }, { merge: true });
    }
  };

  // Handle redirect results (popup-blocked fallback)
  useEffect(() => {
    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          await upsertUserDoc(result.user);
          setUser(result.user);
          toast({
            title: "Signed in",
            description: `Welcome back, ${result.user.displayName || result.user.email || ""}.`,
          });
          setOpen(false);
        }
      } catch {}
    })();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorIn(null);
    setLoadingIn(true);
    try {
      if (passIn.length < 6) {
        throw { code: 'auth/weak-password' };
      }
      await signInWithEmailAndPassword(auth, emailIn.trim(), passIn);
      const cu = auth.currentUser;
      if (cu) {
        await upsertUserDoc(cu);
        const name = cu.displayName || cu.email || "";
        toast({ title: "Signed in", description: name ? `Welcome back, ${name}.` : "Welcome back." });
      }
      setOpen(false);
    } catch (err: any) {
      const code = err?.code as string | undefined;
      const message =
        code === 'auth/invalid-email' ? 'Invalid email address.' :
        code === 'auth/invalid-credential' || code === 'auth/wrong-password' ? 'Incorrect email or password.' :
        code === 'auth/user-disabled' ? 'This account has been disabled.' :
        code === 'auth/user-not-found' ? 'No account found with that email.' :
        'Failed to sign in. Please try again.';
      setErrorIn(message);
    } finally {
      setLoadingIn(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorUp(null);
    setLoadingUp(true);
    try {
      if (passUp.length < 6) {
        throw { code: 'auth/weak-password' };
      }
      const cred = await createUserWithEmailAndPassword(auth, emailUp.trim(), passUp);
      if (nameUp.trim()) {
        await updateProfile(cred.user, { displayName: nameUp.trim() });
      }
      await upsertUserDoc(cred.user);
      toast({
        title: "Account created",
        description: `Welcome, ${nameUp.trim() || emailUp.trim()}.`,
      });
      setOpen(false);
    } catch (err: any) {
      const code = err?.code as string | undefined;
      const message =
        code === 'auth/email-already-in-use' ? 'That email is already in use.' :
        code === 'auth/invalid-email' ? 'Invalid email address.' :
        code === 'auth/weak-password' ? 'Password must be at least 6 characters.' :
        code === 'auth/operation-not-allowed' ? 'Email/password sign-up is disabled in your project.' :
        'Failed to create account. Please try again.';
      setErrorUp(message);
    } finally {
      setLoadingUp(false);
    }
  };

  if (!user) {
    return (
      <>
        <Button onClick={() => setOpen(true)}>Sign in</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">Welcome</DialogTitle>
              <DialogDescription>Sign in or create a free account.</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="sign-in" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sign-in">Sign In</TabsTrigger>
                <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="sign-in">
                <div className="space-y-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-full justify-start gap-3 py-6"
                    onClick={async () => {
                      setErrorIn(null); setErrorUp(null); setGoogleLoading(true);
                      try {
                        const provider = new GoogleAuthProvider();
                        const res = await signInWithPopup(auth, provider);
                        await upsertUserDoc(res.user);
                        setUser(res.user);
                        toast({
                          title: "Signed in",
                          description: `Welcome back, ${res.user.displayName || res.user.email || ""}.`,
                        });
                        setOpen(false);
                      } catch (err: any) {
                        if (err?.code === 'auth/popup-blocked') {
                          try { const provider = new GoogleAuthProvider(); await signInWithRedirect(auth, provider); return; }
                          catch (e: any) { setErrorIn(e?.message ?? 'Google sign-in failed (redirect)'); }
                        } else { setErrorIn(err?.message ?? 'Google sign-in failed'); }
                      } finally { setGoogleLoading(false); }
                    }}
                    disabled={googleLoading}
                    aria-busy={googleLoading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 31.7 29.4 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1.1 7.4 2.8l5.7-5.7C33.8 6.1 29.1 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10 0 19-7.3 19-20 0-1.3-.1-2.7-.4-3.5z"/>
                      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.2 16.4 18.7 14 24 14c2.8 0 5.4 1.1 7.4 2.8l5.7-5.7C33.8 6.1 29.1 4 24 4 16.1 4 9.2 8.3 6.3 14.7z"/>
                      <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.6-5.3l-6.3-5.2C29.4 35 26.9 36 24 36c-5.3 0-9.8-3.4-11.4-8.1l-6.4 4.9C9.1 39.6 15.9 44 24 44z"/>
                      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.7-5.1 7-11.3 7-3.3 0-6.3-1.2-8.6-3.2l-6.4 4.9C12.2 40.6 17.7 44 24 44c10 0 19-7.3 19-20 0-1.3-.1-2.7-.4-3.5z"/>
                    </svg>
                    <span className="mx-auto">{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
                  </Button>
                  <div className="relative my-1">
                    <Separator />
                    <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-background px-2 text-xs text-muted-foreground">OR</span>
                  </div>
                </div>
                <form onSubmit={handleSignIn} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="email-in">Email</Label>
                    <Input id="email-in" type="email" required value={emailIn} onChange={(e) => setEmailIn(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pass-in">Password</Label>
                    <Input id="pass-in" type="password" required value={passIn} onChange={(e) => setPassIn(e.target.value)} />
                  </div>
                  {errorIn && <p className="text-sm text-red-600" role="alert">{errorIn}</p>}
                  <Button type="submit" className="w-full" disabled={loadingIn}>{loadingIn ? "Signing in..." : "Sign In"}</Button>
                </form>
              </TabsContent>
              <TabsContent value="sign-up">
                <div className="space-y-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-full justify-start gap-3 py-6"
                    onClick={async () => {
                      setErrorIn(null); setErrorUp(null); setGoogleLoading(true);
                      try {
                        const provider = new GoogleAuthProvider();
                        const res = await signInWithPopup(auth, provider);
                        await upsertUserDoc(res.user);
                        setUser(res.user);
                        toast({
                          title: "Signed in",
                          description: `Welcome back, ${res.user.displayName || res.user.email || ""}.`,
                        });
                        setOpen(false);
                      } catch (err: any) {
                        if (err?.code === 'auth/popup-blocked') {
                          try { const provider = new GoogleAuthProvider(); await signInWithRedirect(auth, provider); return; }
                          catch (e: any) { setErrorUp(e?.message ?? 'Google sign-in failed (redirect)'); }
                        } else { setErrorUp(err?.message ?? 'Google sign-in failed'); }
                      } finally { setGoogleLoading(false); }
                    }}
                    disabled={googleLoading}
                    aria-busy={googleLoading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 31.7 29.4 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1.1 7.4 2.8l5.7-5.7C33.8 6.1 29.1 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10 0 19-7.3 19-20 0-1.3-.1-2.7-.4-3.5z"/>
                      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.2 16.4 18.7 14 24 14c2.8 0 5.4 1.1 7.4 2.8l5.7-5.7C33.8 6.1 29.1 4 24 4 16.1 4 9.2 8.3 6.3 14.7z"/>
                      <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.6-5.3l-6.3-5.2C29.4 35 26.9 36 24 36c-5.3 0-9.8-3.4-11.4-8.1l-6.4 4.9C9.1 39.6 15.9 44 24 44z"/>
                      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.7-5.1 7-11.3 7-3.3 0-6.3-1.2-8.6-3.2l-6.4 4.9C12.2 40.6 17.7 44 24 44c10 0 19-7.3 19-20 0-1.3-.1-2.7-.4-3.5z"/>
                    </svg>
                    <span className="mx-auto">{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
                  </Button>
                  <div className="relative my-1">
                    <Separator />
                    <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-background px-2 text-xs text-muted-foreground">OR</span>
                  </div>
                </div>
                <form onSubmit={handleSignUp} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="name-up">Name (optional)</Label>
                    <Input id="name-up" type="text" value={nameUp} onChange={(e) => setNameUp(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-up">Email</Label>
                    <Input id="email-up" type="email" required value={emailUp} onChange={(e) => setEmailUp(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pass-up">Password</Label>
                    <Input id="pass-up" type="password" required value={passUp} onChange={(e) => setPassUp(e.target.value)} />
                  </div>
                  {errorUp && <p className="text-sm text-red-600" role="alert">{errorUp}</p>}
                  <Button type="submit" className="w-full" disabled={loadingUp}>{loadingUp ? "Creating account..." : "Create Account"}</Button>
                </form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const nameOrEmail = user.displayName || user.email || "Account";
  const initials = (user.displayName || user.email || "U").slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="p-0 h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await signOut(auth);
            toast({ title: "Signed out", description: "You have been signed out." });
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
