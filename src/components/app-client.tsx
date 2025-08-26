"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import logo from '@/logo/icon (3).png';
import { generateHeadlineVariations } from '@/ai/flows/generate-headline-variations';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Copy,
  Star,
  Download,
  Loader2,
  AlertCircle,
  Sparkles,
  Wand2,
  Mail,
  ThumbsUp,
  Send,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { auth, db } from '../../firebase/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  limit as limitFn,
} from 'firebase/firestore';

type Variation = {
  text: string;
  id: number;
};

export function AppClient() {
  const [headline, setHeadline] = useState('');
  const [variations, setVariations] = useState<Variation[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  // Advanced options
  const [tone, setTone] = useState<string | undefined>(undefined);
  const [audience, setAudience] = useState<string | undefined>(undefined);
  const [includeText, setIncludeText] = useState('');
  const [excludeText, setExcludeText] = useState('');
  const [maxWords, setMaxWords] = useState<number | undefined>(undefined);
  const [maxChars, setMaxChars] = useState<number | undefined>(undefined);

  // Auth and plan
  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem('headlineFavorites');
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (e) {
      console.error('Failed to load favorites from localStorage', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('headlineFavorites', JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites to localStorage', e);
    }
  }, [favorites]);

  // Listen to auth and fetch profile/favorites/history
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setIsPro(false);
      if (u) {
        try {
          const userRef = doc(db, 'users', u.uid);
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            // Initialize a default profile for new users as 'free'
            await setDoc(userRef, { status: 'free', createdAt: serverTimestamp() }, { merge: true });
          }
          const data = snap.exists() ? snap.data() : { status: 'free' };
          setIsPro((data?.status || 'free') === 'pro');
          if (Array.isArray(data?.favorites)) {
            setFavorites(data.favorites);
          }
          // Load initial history
          await loadHistory(u.uid, (data?.status || 'free') === 'pro');
        } catch (e) {
          console.error('Failed to load profile', e);
        }
      } else {
        setHistory([]);
      }
    });
    return () => unsub();
  }, []);

  async function loadHistory(uid: string, pro: boolean) {
    try {
      setHistoryLoading(true);
      const colRef = collection(db, 'users', uid, 'history');
      const q = query(colRef, orderBy('created', 'desc'), limitFn(pro ? 50 : 10));
      const snap = await getDocs(q);
      setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error('Failed to load history', e);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function saveHistoryEntry(payload: any) {
    try {
      if (!user) {
        // store minimal local history for free/anonymous users
        const key = 'headlineLocalHistory';
        const prev = JSON.parse(localStorage.getItem(key) || '[]');
        const entry = { ...payload, created: new Date().toISOString() };
        const capped = [entry, ...prev].slice(0, 10);
        localStorage.setItem(key, JSON.stringify(capped));
        return;
      }
      await addDoc(collection(db, 'users', user.uid, 'history'), {
        ...payload,
        created: serverTimestamp(),
      });
      await loadHistory(user.uid, isPro);
    } catch (e) {
      console.error('Failed to save history', e);
    }
  }

  // Free usage limiting (client-side)
  const DAILY_LIMIT = 20; // adjust as needed
  const usageKeyDate = 'headlineUsageDate';
  const usageKeyCount = 'headlineUsageCount';

  const getToday = () => new Date().toISOString().slice(0, 10);
  const getUsage = () => {
    try {
      const storedDate = localStorage.getItem(usageKeyDate);
      const storedCount = Number(localStorage.getItem(usageKeyCount) || '0');
      const today = getToday();
      if (storedDate !== today) {
        localStorage.setItem(usageKeyDate, today);
        localStorage.setItem(usageKeyCount, '0');
        return 0;
      }
      return storedCount;
    } catch {
      return 0;
    }
  };
  const incUsage = () => {
    try {
      const today = getToday();
      const count = getUsage() + 1;
      localStorage.setItem(usageKeyDate, today);
      localStorage.setItem(usageKeyCount, String(count));
    } catch {}
  };

  const parseKeywords = (s: string) =>
    s
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

  const handleGenerate = async () => {
    if (!headline.trim()) {
      setError('Please enter a headline to optimize.');
      return;
    }
    // Enforce daily limit for free users
    const used = getUsage();
    if (!isPro && used >= DAILY_LIMIT) {
      setError(`Daily limit reached. You've used ${used}/${DAILY_LIMIT} generations today.`);
      toast({
        variant: 'destructive',
        title: 'Daily Limit Reached',
        description: 'Upgrade to Pro for unlimited generations.',
      });
      return;
    }
    setIsLoading(true);
    setError(null);
    setVariations([]);

    try {
      const payload: any = {
        headline,
      };
      if (tone) payload.tone = tone as any;
      if (audience) payload.audience = audience as any;
      const includes = parseKeywords(includeText);
      const excludes = parseKeywords(excludeText);
      if (includes.length) payload.includeKeywords = includes;
      if (excludes.length) payload.excludeKeywords = excludes;
      if (maxWords && maxWords > 0) payload.maxWords = maxWords;
      if (maxChars && maxChars > 0) payload.maxChars = maxChars;

      const result = await generateHeadlineVariations(payload);
      setVariations(result.variations.map((v, i) => ({ text: v, id: i })));
      incUsage();
      // Save to history
      await saveHistoryEntry({
        input: headline,
        tone: tone || null,
        audience: audience || null,
        variations: result.variations,
      });
      setTimeout(() => setIsModalOpen(true), 1000); // Open modal after generation
    } catch (e: any) {
      const errorMessage =
        'An error occurred while generating headlines. Please try again.';
      setError(errorMessage);
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description:
          'Could not generate headlines. Please check the console for more details.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = (text: string) => {
    setFavorites((prev) => {
      const next = prev.includes(text)
        ? prev.filter((fav) => fav !== text)
        : [...prev, text];
      // Cloud sync for signed-in users
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        updateDoc(userRef, prev.includes(text) ? { favorites: arrayRemove(text) } : { favorites: arrayUnion(text) })
          .catch((e) => console.error('Failed to sync favorites', e));
      }
      return next;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast({
          title: 'Copied to clipboard!',
          description: `"${text.substring(0, 40)}..."`,
        });
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
        toast({
          variant: 'destructive',
          title: 'Copy Failed',
          description: 'Could not copy to clipboard.',
        });
      });
  };

  const exportToFile = (format: 'txt' | 'csv') => {
    if (variations.length === 0) return;
    const content =
      format === 'csv'
        ? `headline\n${variations
            .map((v) => `"${v.text.replace(/"/g, '""')}"`)
            .join('\n')}`
        : variations.map((v) => v.text).join('\n');

    const blob = new Blob([content], {
      type:
        format === 'csv'
          ? 'text/csv;charset=utf-8;'
          : 'text/plain;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `headlines.${format}`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportToNotion = async () => {
    if (!isPro) {
      toast({ variant: 'destructive', title: 'Pro Feature', description: 'Upgrade to Pro to export to Notion.' });
      return;
    }
    try {
      const idToken = user ? await user.getIdToken() : undefined;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
      const res = await fetch('/api/export/notion', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: headline || 'AI Headline Variations',
          headlines: variations.map(v => v.text),
          tone,
          audience,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Exported to Notion', description: 'Check your Notion workspace.' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Notion export is not configured or failed.' });
    }
  };

  const exportToGoogleDocs = async () => {
    if (!isPro) {
      toast({ variant: 'destructive', title: 'Pro Feature', description: 'Upgrade to Pro to export to Google Docs.' });
      return;
    }
    try {
      const idToken = user ? await user.getIdToken() : undefined;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
      const res = await fetch('/api/export/google-docs', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: headline || 'AI Headline Variations',
          headlines: variations.map(v => v.text),
          tone,
          audience,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Exported to Google Docs', description: 'Check your Drive.' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Google Docs export is not configured or failed.' });
    }
  };

  return (
    <>
      <div className="container py-12 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <Card className="overflow-hidden shadow-lg">
            <CardContent className="p-6">
              <div className="mb-2 flex items-center gap-2">
                <Image src={logo} alt="Logo" width={24} height={24} className="h-6 w-6 rounded" />
                <Wand2 className="h-6 w-6 text-primary" />
                <h1 className="font-headline text-2xl font-bold">AI Headline Fixer</h1>
              </div>
              <p className="mb-4 text-muted-foreground">
                Enter your headline below and we'll generate 5 click-worthy
                alternatives.
              </p>
              <div className="grid w-full gap-2">
                <Textarea
                  placeholder="e.g., How to improve your writing skills"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  rows={3}
                  className="text-base"
                  aria-label="Headline Input"
                />

                {/* Advanced options */}
                <div className="rounded-lg border p-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="tone">Tone (optional)</Label>
                      <Select onValueChange={(v) => setTone(v)} value={tone}>
                        <SelectTrigger id="tone" aria-label="Tone">
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="authoritative">Authoritative</SelectItem>
                          <SelectItem value="playful">Playful</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="witty">Witty</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="audience">Audience (optional)</Label>
                      <Select onValueChange={(v) => setAudience(v)} value={audience}>
                        <SelectTrigger id="audience" aria-label="Audience">
                          <SelectValue placeholder="Select audience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="marketers">Marketers</SelectItem>
                          <SelectItem value="developers">Developers</SelectItem>
                          <SelectItem value="product managers">Product Managers</SelectItem>
                          <SelectItem value="executives">Executives</SelectItem>
                          <SelectItem value="founders">Founders</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="include">Include keywords (comma-separated)</Label>
                      <Input
                        id="include"
                        placeholder="e.g., SEO, conversion, traffic"
                        value={includeText}
                        onChange={(e) => setIncludeText(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="exclude">Exclude keywords (comma-separated)</Label>
                      <Input
                        id="exclude"
                        placeholder="e.g., clickbait, hack"
                        value={excludeText}
                        onChange={(e) => setExcludeText(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maxWords">Max words</Label>
                        <Input
                          id="maxWords"
                          type="number"
                          min={1}
                          placeholder="12"
                          value={maxWords ?? ''}
                          onChange={(e) =>
                            setMaxWords(e.target.value ? Number(e.target.value) : undefined)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxChars">Max chars</Label>
                        <Input
                          id="maxChars"
                          type="number"
                          min={10}
                          placeholder="65"
                          value={maxChars ?? ''}
                          onChange={(e) =>
                            setMaxChars(e.target.value ? Number(e.target.value) : undefined)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <Button onClick={handleGenerate} disabled={isLoading} size="lg">
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Fix my headline
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="mt-8">
            {isLoading && (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            )}

            {!isLoading && variations.length > 0 && (
              <div className="fade-in-up">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-headline text-xl font-bold">
                    Generated Headlines
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportToFile('txt')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      TXT
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportToFile('csv')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportToNotion}
                      title={isPro ? 'Export to Notion' : 'Pro only'}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Notion
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportToGoogleDocs}
                      title={isPro ? 'Export to Google Docs' : 'Pro only'}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Google Docs
                    </Button>
                  </div>
                </div>

                {/* Mobile: list view */}
                <div className="space-y-3 md:hidden">
                  {variations.map((variation, index) => (
                    <Card
                      key={variation.id}
                      className="group flex items-center justify-between p-4 transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-xl font-bold text-primary">{index + 1}.</span>
                        <p className="text-foreground">{variation.text}</p>
                      </div>
                      <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(variation.text)}
                          aria-label="Copy headline"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFavorite(variation.text)}
                          aria-label="Favorite headline"
                        >
                          <Star
                            className={`h-4 w-4 transition-colors ${
                              favorites.includes(variation.text)
                                ? 'fill-accent text-accent'
                                : 'text-muted-foreground'
                            }`}
                          />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop: grid view */}
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {variations.map((variation, index) => (
                    <Card
                      key={variation.id}
                      className="group p-4 transition-shadow hover:shadow-md h-full"
                    >
                      <div className="flex flex-col gap-3 h-full">
                        <div className="flex items-start gap-3">
                          <span className="text-lg font-bold text-primary">{index + 1}.</span>
                          <p className="text-foreground">{variation.text}</p>
                        </div>
                        <div className="mt-auto flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(variation.text)}
                            aria-label="Copy headline"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFavorite(variation.text)}
                            aria-label="Favorite headline"
                          >
                            <Star
                              className={`h-4 w-4 transition-colors ${
                                favorites.includes(variation.text)
                                  ? 'fill-accent text-accent'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* History section */}
          <div className="mt-8">
            <h3 className="font-headline text-lg font-bold mb-2">History {isPro ? '' : '(showing recent)'}</h3>
            {historyLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <p className="text-muted-foreground text-sm">No history yet.</p>
            ) : (
              <div className="space-y-2">
                {history.map((h) => (
                  <Card key={h.id} className="p-3">
                    <div className="text-sm text-muted-foreground">{h.tone || '—'} {h.audience ? `· ${h.audience}` : ''}</div>
                    <div className="font-medium">{h.input}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(h.variations || []).slice(0, 3).map((t: string, idx: number) => (
                        <Button key={idx} variant="secondary" size="sm" onClick={() => copyToClipboard(t)}>
                          Copy #{idx + 1}
                        </Button>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="items-center text-center">
            <div className="rounded-full bg-primary/10 p-3">
               <ThumbsUp className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="font-headline text-2xl pt-2">Like the results?</DialogTitle>
            <DialogDescription>
              Sign up to get our best content toolkits, copywriting formulas, and AI pro features delivered to your inbox.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsModalOpen(false);
              toast({ title: "Subscribed!", description: "Thanks for joining our newsletter." });
            }}
            className="space-y-4"
          >
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                required
                className="pl-10"
              />
            </div>
            <Button type="submit" className="w-full">
              Subscribe for Free
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
