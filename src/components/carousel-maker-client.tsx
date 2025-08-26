"use client";

import { useState } from "react";
import { generateCarouselSlides } from "@/ai/flows/generate-carousel-slides";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Images, Loader2, Sparkles, Copy, Download } from "lucide-react";

export function CarouselMakerClient() {
  const [caption, setCaption] = useState("");
  const [slides, setSlides] = useState<number>(7);
  const [style, setStyle] = useState<string | undefined>("educational");
  const [platform, setPlatform] = useState<string | undefined>("instagram");
  const [audience, setAudience] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<{ title: string; bullets: string[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const DAILY_LIMIT = 15;
  const usageKeyDate = "carouselUsageDate";
  const usageKeyCount = "carouselUsageCount";

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
      const count = getUsage() + 1;
      localStorage.setItem(usageKeyDate, today);
      localStorage.setItem(usageKeyCount, String(count));
    } catch {}
  };

  const handleGenerate = async () => {
    if (!caption.trim()) {
      toast({ variant: "destructive", title: "Add a caption/topic", description: "Describe your post to build a carousel." });
      return;
    }
    const used = getUsage();
    if (used >= DAILY_LIMIT) {
      toast({ variant: "destructive", title: "Daily Limit Reached", description: `You've used ${used}/${DAILY_LIMIT} generations today.` });
      return;
    }

    setLoading(true);
    setResult([]);
    try {
      const res = await generateCarouselSlides({
        caption,
        slides,
        style: style as any,
        platform: platform as any,
        audience: audience as any,
      });
      setResult(res.slides);
      incUsage();
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Generation Failed", description: "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const copyAll = async () => {
    try {
      const text = result
        .map((s, i) => `Slide ${i + 1}: ${s.title}\n- ${s.bullets.join("\n- ")}`)
        .join("\n\n");
      await navigator.clipboard.writeText(text);
      toast({ title: "Carousel copied" });
    } catch {
      toast({ variant: "destructive", title: "Copy failed" });
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ slides: result }, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "carousel.json";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportCSV = () => {
    if (result.length === 0) return;
    const rows = ["index,title,bullets"]; 
    result.forEach((s, i) => {
      const title = `"${s.title.replace(/"/g, '""')}"`;
      const bullets = `"${s.bullets.join(" | ").replace(/"/g, '""')}"`;
      rows.push(`${i + 1},${title},${bullets}`);
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "carousel.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <>
      <div className="mx-auto max-w-3xl">
        <Card className="overflow-hidden shadow-lg">
          <CardContent className="p-6">
            <div className="mb-2 flex items-center gap-2">
              <Images className="h-6 w-6 text-primary" />
              <h1 className="font-headline text-2xl font-bold">Carousel Maker</h1>
            </div>
            <p className="mb-4 text-muted-foreground">
              Turn one idea into a polished multi-slide carousel with hooks, structure, and CTA.
            </p>
            <div className="grid w-full gap-2">
              <Textarea
                placeholder="Paste your caption or topic..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                className="text-base"
                aria-label="Caption Input"
              />

              <div className="rounded-lg border p-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="slides">Slides</Label>
                    <Input
                      id="slides"
                      type="number"
                      min={3}
                      max={10}
                      placeholder="7"
                      value={slides}
                      onChange={(e) => setSlides(e.target.value ? Math.min(10, Math.max(3, Number(e.target.value))) : 7)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="style">Style</Label>
                    <Select onValueChange={(v) => setStyle(v)} value={style}>
                      <SelectTrigger id="style" aria-label="Style">
                        <SelectValue placeholder="Choose style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="tips">Tips</SelectItem>
                        <SelectItem value="story">Story</SelectItem>
                        <SelectItem value="case-study">Case Study</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Select onValueChange={(v) => setPlatform(v)} value={platform}>
                      <SelectTrigger id="platform" aria-label="Platform">
                        <SelectValue placeholder="Instagram" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="twitter">Twitter/X</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="audience">Audience</Label>
                    <Select onValueChange={(v) => setAudience(v)} value={audience}>
                      <SelectTrigger id="audience" aria-label="Audience">
                        <SelectValue placeholder="General" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="marketers">Marketers</SelectItem>
                        <SelectItem value="developers">Developers</SelectItem>
                        <SelectItem value="founders">Founders</SelectItem>
                        <SelectItem value="creators">Creators</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <Button onClick={handleGenerate} disabled={loading} size="lg">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generate Carousel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result.length > 0 && (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-headline text-xl font-bold">Slides</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyAll}>
                  <Copy className="mr-2 h-4 w-4" /> Copy All
                </Button>
                <Button variant="outline" size="sm" onClick={exportJSON}>
                  <Download className="mr-2 h-4 w-4" /> JSON
                </Button>
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <Download className="mr-2 h-4 w-4" /> CSV
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {result.map((s, i) => (
                <Card key={i} className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Slide {i + 1}</div>
                  <div className="font-medium mb-2">{s.title}</div>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {s.bullets.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
