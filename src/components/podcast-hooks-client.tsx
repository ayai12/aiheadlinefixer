"use client";

import { useState } from "react";
import { generatePodcastHooks } from "@/ai/flows/generate-podcast-hooks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Mic2, Loader2, Sparkles, Copy, Download } from "lucide-react";

export function PodcastHooksClient() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<string | undefined>("any");
  const [tone, setTone] = useState<string | undefined>("insightful");
  const [count, setCount] = useState<number>(12);
  const [hooks, setHooks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const DAILY_LIMIT = 20;
  const usageKeyDate = "podcastUsageDate";
  const usageKeyCount = "podcastUsageCount";

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
    if (!topic.trim()) {
      toast({ variant: "destructive", title: "Add a topic/description", description: "Describe your episode to get hooks." });
      return;
    }
    const used = getUsage();
    if (used >= DAILY_LIMIT) {
      toast({ variant: "destructive", title: "Daily Limit Reached", description: `You've used ${used}/${DAILY_LIMIT} generations today.` });
      return;
    }

    setLoading(true);
    setHooks([]);
    try {
      const res = await generatePodcastHooks({
        topic,
        platform: platform as any,
        tone: tone as any,
        maxCount: count,
      });
      setHooks(res.hooks);
      incUsage();
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Generation Failed", description: "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const copyOne = async (t: string) => {
    try {
      await navigator.clipboard.writeText(t);
      toast({ title: "Copied", description: t });
    } catch {
      toast({ variant: "destructive", title: "Copy failed" });
    }
  };

  const copyAll = async () => {
    try {
      const text = hooks.join("\n");
      await navigator.clipboard.writeText(text);
      toast({ title: "All hooks copied" });
    } catch {
      toast({ variant: "destructive", title: "Copy failed" });
    }
  };

  const exportToFile = (format: "txt" | "csv") => {
    if (hooks.length === 0) return;
    const content =
      format === "csv"
        ? `hook\n${hooks.map((v) => `"${v.replace(/"/g, '""')}"`).join("\n")}`
        : hooks.join("\n");
    const blob = new Blob([content], { type: format === "csv" ? "text/csv;charset=utf-8;" : "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `podcast-hooks.${format}`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <>
      <div className="mx-auto max-w-3xl">
        <Card className="overflow-hidden shadow-lg">
          <CardContent className="p-6">
            <div className="mb-2 flex items-center gap-2">
              <Mic2 className="h-6 w-6 text-primary" />
              <h1 className="font-headline text-2xl font-bold">Podcast Hooks</h1>
            </div>
            <p className="mb-4 text-muted-foreground">
              Generate hook lines that make listeners stop scrolling and press play.
            </p>
            <div className="grid w-full gap-2">
              <Textarea
                placeholder="Describe your episode topic, guest, or key idea..."
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
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="spotify">Spotify</SelectItem>
                        <SelectItem value="apple">Apple Podcasts</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tone">Tone</Label>
                    <Select onValueChange={(v) => setTone(v)} value={tone}>
                      <SelectTrigger id="tone" aria-label="Tone">
                        <SelectValue placeholder="Tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="insightful">Insightful</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="controversial">Controversial</SelectItem>
                        <SelectItem value="story">Story</SelectItem>
                        <SelectItem value="humorous">Humorous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="count">How many?</Label>
                    <Input
                      id="count"
                      type="number"
                      min={5}
                      max={25}
                      placeholder="12"
                      value={count}
                      onChange={(e) => setCount(e.target.value ? Math.min(25, Math.max(5, Number(e.target.value))) : 12)}
                    />
                  </div>
                </div>

                <Separator />

                <Button onClick={handleGenerate} disabled={loading} size="lg">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generate Hooks
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {hooks.length > 0 && (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-headline text-xl font-bold">Results</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyAll}>
                  <Copy className="mr-2 h-4 w-4" /> Copy All
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportToFile("txt")}>
                  <Download className="mr-2 h-4 w-4" /> TXT
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportToFile("csv")}>
                  <Download className="mr-2 h-4 w-4" /> CSV
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              {hooks.map((t, i) => (
                <Card key={i} className="p-4 hover:bg-muted/40 cursor-pointer" onClick={() => copyOne(t)} title="Click to copy">
                  {t || <span className="text-muted-foreground">(empty)</span>}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
