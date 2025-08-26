"use client";

import { useState } from "react";
import { generateHookCaptions } from "@/ai/flows/generate-hook-captions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Clapperboard, Loader2, Sparkles, Copy, Download } from "lucide-react";

interface Item { hook: string; caption: string }

export function CaptionHookGeneratorClient() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<string | undefined>("instagram");
  const [tone, setTone] = useState<string | undefined>("neutral");
  const [count, setCount] = useState<number>(10);

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const DAILY_LIMIT = 20;
  const usageKeyDate = "hookcapUsageDate";
  const usageKeyCount = "hookcapUsageCount";

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

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ variant: "destructive", title: "Add a topic/idea", description: "Describe your short-form video idea." });
      return;
    }
    const used = getUsage();
    if (used >= DAILY_LIMIT) {
      toast({ variant: "destructive", title: "Daily Limit Reached", description: `You've used ${used}/${DAILY_LIMIT} generations today.` });
      return;
    }

    setLoading(true);
    setItems([]);

    try {
      const res = await generateHookCaptions({
        topic,
        platform: platform as any,
        tone: tone as any,
        count,
      });
      setItems(res.items || []);
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

  const copyAll = () => {
    if (!items.length) return;
    const text = items.map((it, i) => `${i + 1}. ${it.hook}\n${it.caption}`).join("\n\n");
    copyText(text);
  };

  const exportTxt = () => {
    if (!items.length) return;
    const content = items.map((it, i) => `${i + 1}. ${it.hook}\n${it.caption}`).join("\n\n");
    download("caption-hook-pairs.txt", content, "text/plain;charset=utf-8;");
  };

  const exportCsv = () => {
    if (!items.length) return;
    const header = "hook,caption";
    const rows = items.map((it) => [it.hook, it.caption].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const content = [header, ...rows].join("\n");
    download("caption-hook-pairs.csv", content, "text/csv;charset=utf-8;");
  };

  const download = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="overflow-hidden shadow-lg">
        <CardContent className="p-6">
          <div className="mb-2 flex items-center gap-2">
            <Clapperboard className="h-6 w-6 text-primary" />
            <h1 className="font-headline text-2xl font-bold">Caption & Hook Generator</h1>
          </div>
          <p className="mb-4 text-muted-foreground">
            Generate scroll-stopping on-screen hooks and platform-optimized captions for Reels, TikTok, and YouTube Shorts.
          </p>

          <div className="grid w-full gap-2">
            <Textarea
              placeholder="Describe your short-form video idea or topic..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              className="text-base"
              aria-label="Topic Input"
            />

            <div className="rounded-lg border p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select onValueChange={(v) => setPlatform(v)} value={platform}>
                    <SelectTrigger id="platform" aria-label="Platform">
                      <SelectValue placeholder="Instagram" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select onValueChange={(v) => setTone(v)} value={tone}>
                    <SelectTrigger id="tone" aria-label="Tone">
                      <SelectValue placeholder="Neutral" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="energetic">Energetic</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="witty">Witty</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="count">How many pairs?</Label>
                  <Input
                    id="count"
                    type="number"
                    min={4}
                    max={25}
                    placeholder="10"
                    value={count}
                    onChange={(e) => setCount(e.target.value ? Math.min(25, Math.max(4, Number(e.target.value))) : 10)}
                  />
                </div>
              </div>

              <Separator />

              <Button onClick={handleGenerate} disabled={loading} size="lg">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Hooks & Captions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-headline text-xl font-bold">Results</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyAll}>
                <Copy className="mr-2 h-4 w-4" /> Copy All
              </Button>
              <Button variant="outline" size="sm" onClick={exportTxt}>
                <Download className="mr-2 h-4 w-4" /> TXT
              </Button>
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <Download className="mr-2 h-4 w-4" /> CSV
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            {items.map((it, i) => (
              <Card key={i} className="p-4">
                <div className="font-semibold">{it.hook}</div>
                <div className="mt-1 text-sm text-muted-foreground">{it.caption}</div>
                <div className="mt-3">
                  <Button size="sm" variant="outline" onClick={() => copyText(`${it.hook}\n${it.caption}`)}>
                    <Copy className="mr-2 h-4 w-4" /> Copy
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
