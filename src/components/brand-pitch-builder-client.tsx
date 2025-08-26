"use client";

import { useState } from "react";
import { generateBrandPitch } from "@/ai/flows/generate-brand-pitch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Handshake, Loader2, Sparkles, Copy, Download, CheckSquare } from "lucide-react";

interface MediaPlatform { name: string; highlights: string }
interface MediaKit {
  bio: string;
  audience: string;
  platforms: MediaPlatform[];
  stats: string[];
  pastWork?: string[];
  suggestedDeliverables: string[];
}
interface Pricing { perPost: string; perVideo: string; bundle: string; notes: string }

export function BrandPitchBuilderClient() {
  const [niche, setNiche] = useState("");
  const [audienceSize, setAudienceSize] = useState<number>(1000);
  const [brand, setBrand] = useState("");
  const [region, setRegion] = useState("");
  const [pastBrands, setPastBrands] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["instagram", "tiktok", "youtube"]);

  const [email, setEmail] = useState("");
  const [mediaKit, setMediaKit] = useState<MediaKit | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const DAILY_LIMIT = 10;
  const usageKeyDate = "pitchUsageDate";
  const usageKeyCount = "pitchUsageCount";

  const getToday = () => new Date().toISOString().slice(0, 10);
  const getUsage = () => {
    try {
      const storedDate = localStorage.getItem(usageKeyDate);
      const storedCount = Number(localStorage.getItem(usageKeyCount) || "0");
      const today = getToday();
      if (storedDate !== today) {
        localStorage.setItem(usageKeyDate, today);
        localStorage.setItem(usageKeyCount, "0");
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
      const c = getUsage() + 1;
      localStorage.setItem(usageKeyDate, today);
      localStorage.setItem(usageKeyCount, String(c));
    } catch {}
  };

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const handleGenerate = async () => {
    if (!niche.trim()) {
      toast({ variant: "destructive", title: "Add a niche", description: "Tell us your creator niche." });
      return;
    }
    if (platforms.length === 0) {
      toast({ variant: "destructive", title: "Select platforms", description: "Choose at least one platform." });
      return;
    }
    const used = getUsage();
    if (used >= DAILY_LIMIT) {
      toast({ variant: "destructive", title: "Daily Limit Reached", description: `You've used ${used}/${DAILY_LIMIT} generations today.` });
      return;
    }

    setLoading(true);
    setEmail("");
    setMediaKit(null);
    setPricing(null);

    try {
      const pastArr = pastBrands
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await generateBrandPitch({
        niche,
        audienceSize,
        platforms,
        brand: brand || undefined,
        region: region || undefined,
        pastBrands: pastArr.length ? pastArr : undefined,
      });
      setEmail(res.email);
      setMediaKit(res.mediaKit);
      setPricing(res.pricing);
      incUsage();
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Generation Failed", description: "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied" });
    } catch {
      toast({ variant: "destructive", title: "Copy failed" });
    }
  };

  const download = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportTxt = () => {
    const lines: string[] = [];
    if (email) {
      lines.push("EMAIL PITCH:", email, "");
    }
    if (mediaKit) {
      lines.push("MEDIA KIT:");
      lines.push(`Bio: ${mediaKit.bio}`);
      lines.push(`Audience: ${mediaKit.audience}`);
      lines.push("Platforms:");
      mediaKit.platforms.forEach((p) => lines.push(`- ${p.name}: ${p.highlights}`));
      if (mediaKit.stats?.length) {
        lines.push("Stats:");
        mediaKit.stats.forEach((s) => lines.push(`- ${s}`));
      }
      if (mediaKit.pastWork?.length) {
        lines.push("Past Work:");
        mediaKit.pastWork.forEach((s) => lines.push(`- ${s}`));
      }
      if (mediaKit.suggestedDeliverables?.length) {
        lines.push("Suggested Deliverables:");
        mediaKit.suggestedDeliverables.forEach((s) => lines.push(`- ${s}`));
      }
      lines.push("");
    }
    if (pricing) {
      lines.push("PRICING:");
      lines.push(`Per post: ${pricing.perPost}`);
      lines.push(`Per video: ${pricing.perVideo}`);
      lines.push(`Bundle: ${pricing.bundle}`);
      lines.push(`Notes: ${pricing.notes}`);
      lines.push("");
    }
    download("brand-pitch.txt", lines.join("\n"), "text/plain;charset=utf-8;");
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="overflow-hidden shadow-lg">
        <CardContent className="p-6">
          <div className="mb-2 flex items-center gap-2">
            <Handshake className="h-6 w-6 text-primary" />
            <h1 className="font-headline text-2xl font-bold">Brand Deal Pitch Builder</h1>
          </div>
          <p className="mb-4 text-muted-foreground">
            Generate custom pitch email, media kit summary, and pricing suggestions based on your audience and niche.
          </p>

          <div className="grid w-full gap-3">
            <Textarea
              placeholder="Describe your niche (e.g., AI tools educator, travel vlogger, fitness coach)"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              rows={3}
              className="text-base"
            />

            <div className="rounded-lg border p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="audienceSize">Total audience size</Label>
                  <Input
                    id="audienceSize"
                    type="number"
                    min={100}
                    placeholder="e.g., 12000"
                    value={audienceSize}
                    onChange={(e) => setAudienceSize(Math.max(100, Number(e.target.value || 1000)))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Target brand (optional)</Label>
                  <Input id="brand" placeholder="e.g., Notion" value={brand} onChange={(e) => setBrand(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region (optional)</Label>
                  <Input id="region" placeholder="Global, US, UK..." value={region} onChange={(e) => setRegion(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pastBrands">Past brand collaborations (comma-separated)</Label>
                  <Input id="pastBrands" placeholder="e.g., Adobe, Miro" value={pastBrands} onChange={(e) => setPastBrands(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Platforms</Label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { key: "instagram", label: "Instagram" },
                    { key: "tiktok", label: "TikTok" },
                    { key: "youtube", label: "YouTube" },
                    { key: "twitter", label: "Twitter/X" },
                    { key: "linkedin", label: "LinkedIn" },
                  ].map((p) => {
                    const active = platforms.includes(p.key);
                    return (
                      <Button
                        key={p.key}
                        type="button"
                        variant={active ? "default" : "outline"}
                        size="sm"
                        onClick={() => togglePlatform(p.key)}
                      >
                        <CheckSquare className="mr-2 h-4 w-4" /> {p.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <Separator />

              <Button onClick={handleGenerate} disabled={loading} size="lg">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Pitch
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {(email || mediaKit || pricing) && (
        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-xl font-bold">Your Pitch Pack</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => exportTxt()}>
                <Download className="mr-2 h-4 w-4" /> TXT
              </Button>
            </div>
          </div>

          {email && (
            <Card className="p-4">
              <div className="mb-2 font-semibold">Email</div>
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{email}</pre>
              <div className="mt-3">
                <Button size="sm" variant="outline" onClick={() => copyText(email)}>
                  <Copy className="mr-2 h-4 w-4" /> Copy Email
                </Button>
              </div>
            </Card>
          )}

          {mediaKit && (
            <Card className="p-4">
              <div className="mb-2 font-semibold">Media Kit</div>
              <div className="text-sm"><span className="font-medium">Bio:</span> {mediaKit.bio}</div>
              <div className="text-sm"><span className="font-medium">Audience:</span> {mediaKit.audience}</div>
              <div className="mt-2 text-sm">
                <div className="font-medium">Platforms</div>
                <ul className="list-disc pl-5">
                  {mediaKit.platforms.map((p, i) => (
                    <li key={i}>{p.name}: {p.highlights}</li>
                  ))}
                </ul>
              </div>
              {mediaKit.stats?.length ? (
                <div className="mt-2 text-sm">
                  <div className="font-medium">Stats</div>
                  <ul className="list-disc pl-5">
                    {mediaKit.stats.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {mediaKit.pastWork?.length ? (
                <div className="mt-2 text-sm">
                  <div className="font-medium">Past Work</div>
                  <ul className="list-disc pl-5">
                    {mediaKit.pastWork.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {mediaKit.suggestedDeliverables?.length ? (
                <div className="mt-2 text-sm">
                  <div className="font-medium">Suggested Deliverables</div>
                  <ul className="list-disc pl-5">
                    {mediaKit.suggestedDeliverables.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </Card>
          )}

          {pricing && (
            <Card className="p-4">
              <div className="mb-2 font-semibold">Pricing Suggestions</div>
              <div className="text-sm">Per post: {pricing.perPost}</div>
              <div className="text-sm">Per video: {pricing.perVideo}</div>
              <div className="text-sm">Bundle: {pricing.bundle}</div>
              <div className="text-sm text-muted-foreground">{pricing.notes}</div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
