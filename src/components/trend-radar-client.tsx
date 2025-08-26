"use client";

import { useState } from "react";
import { generateTrendRadar } from "@/ai/flows/generate-trend-radar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Radar, Loader2, Sparkles, Copy, Download } from "lucide-react";

interface Topic {
  topic: string;
  reason: string;
  ideas: { angle: string; format: string }[];
}

export function TrendRadarClient() {
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState<string | undefined>("instagram");
  const [format, setFormat] = useState<string | undefined>("post");
  const [audience, setAudience] = useState<string | undefined>("general");
  const [region, setRegion] = useState<string | undefined>("");
  const [timeframe, setTimeframe] = useState<string | undefined>("week");
  const [maxTopics, setMaxTopics] = useState<number>(10);
  const [ideasPerTopic, setIdeasPerTopic] = useState<number>(3);

  const [topics, setTopics] = useState<Topic[]>([]);

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const DAILY_LIMIT = 20;
  const usageKeyDate = "trendUsageDate";
  const usageKeyCount = "trendUsageCount";

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
    if (!niche.trim()) {
      toast({ variant: "destructive", title: "Add a niche or keywords", description: "Tell us what space to scan for trends." });
      return;
    }
    const used = getUsage();
    if (used >= DAILY_LIMIT) {
      toast({ variant: "destructive", title: "Daily Limit Reached", description: `You've used ${used}/${DAILY_LIMIT} generations today.` });
      return;
    }

    setLoading(true);
    setTopics([]);

    try {
      const res = await generateTrendRadar({
        niche,
        platform: platform as any,
        format: format as any,
        audience: audience as any,
        region: region || undefined,
        timeframe: timeframe as any,
        maxTopics,
        ideasPerTopic,
      });
      setTopics(res.topics || []);
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

  const exportTopicsTxt = () => {
    if (!topics.length) return;
    const lines: string[] = [];
    topics.forEach((t, i) => {
      lines.push(`${i + 1}. ${t.topic}`);
      lines.push(`   Why now: ${t.reason}`);
      t.ideas.forEach((id, j) => lines.push(`   - [${id.format}] ${id.angle}`));
    });
    download(`trend-radar.txt`, lines.join("\n"), "text/plain;charset=utf-8;");
  };

  const exportTopicsCsv = () => {
    if (!topics.length) return;
    const header = "topic,reason,angle,format";
    const rows = topics.flatMap((t) =>
      t.ideas.map((id) =>
        [t.topic, t.reason, id.angle, id.format].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      )
    );
    const content = [header, ...rows].join("\n");
    download(`trend-radar.csv`, content, "text/csv;charset=utf-8;");
  };

  const download = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const copyAll = () => {
    if (!topics.length) return;
    const text = topics
      .map((t, i) => {
        const ideas = t.ideas.map((id) => `- [${id.format}] ${id.angle}`).join("\n");
        return `${i + 1}. ${t.topic}\nWhy now: ${t.reason}\n${ideas}`;
      })
      .join("\n\n");
    copyText(text);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="overflow-hidden shadow-lg">
        <CardContent className="p-6">
          <div className="mb-2 flex items-center gap-2">
            <Radar className="h-6 w-6 text-primary" />
            <h1 className="font-headline text-2xl font-bold">Trend Radar</h1>
          </div>
          <p className="mb-4 text-muted-foreground">
            Surface trending topics in your niche and get execution angles for posts, videos, or carousels.
          </p>
          <div className="grid w-full gap-2">
            <Textarea
              placeholder="Enter a niche or keywords, e.g., 'AI marketing', 'frontend dev', 'fitness coaching'..."
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              rows={3}
              className="text-base"
              aria-label="Niche Input"
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
                      <SelectItem value="twitter">Twitter/X</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format">Preferred format</Label>
                  <Select onValueChange={(v) => setFormat(v)} value={format}>
                    <SelectTrigger id="format" aria-label="Preferred format">
                      <SelectValue placeholder="Post" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="post">Post</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="reel">Reel</SelectItem>
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="carousel">Carousel</SelectItem>
                      <SelectItem value="thread">Thread</SelectItem>
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
                      <SelectItem value="designers">Designers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input id="region" placeholder="Global, US, UK..." value={region} onChange={(e) => setRegion(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeframe">Timeframe</Label>
                  <Select onValueChange={(v) => setTimeframe(v)} value={timeframe}>
                    <SelectTrigger id="timeframe" aria-label="Timeframe">
                      <SelectValue placeholder="This week" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This week</SelectItem>
                      <SelectItem value="month">This month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTopics">How many topics?</Label>
                  <Input
                    id="maxTopics"
                    type="number"
                    min={3}
                    max={20}
                    placeholder="10"
                    value={maxTopics}
                    onChange={(e) => setMaxTopics(e.target.value ? Math.min(20, Math.max(3, Number(e.target.value))) : 10)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ideasPerTopic">Ideas per topic</Label>
                  <Input
                    id="ideasPerTopic"
                    type="number"
                    min={1}
                    max={6}
                    placeholder="3"
                    value={ideasPerTopic}
                    onChange={(e) => setIdeasPerTopic(e.target.value ? Math.min(6, Math.max(1, Number(e.target.value))) : 3)}
                  />
                </div>
              </div>

              <Separator />

              <Button onClick={handleGenerate} disabled={loading} size="lg">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Scan Trends & Generate Ideas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {topics.length > 0 && (
        <div className="mt-6 space-y-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-headline text-xl font-bold">Trending Topics</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyAll}>
                <Copy className="mr-2 h-4 w-4" /> Copy All
              </Button>
              <Button variant="outline" size="sm" onClick={exportTopicsTxt}>
                <Download className="mr-2 h-4 w-4" /> TXT
              </Button>
              <Button variant="outline" size="sm" onClick={exportTopicsCsv}>
                <Download className="mr-2 h-4 w-4" /> CSV
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            {topics.map((t, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">{t.topic}</div>
                    <div className="mt-1 text-sm text-muted-foreground">Why now: {t.reason}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {t.ideas.map((id, j) => (
                    <Badge key={`${i}-${j}`} variant="secondary" className="rounded-full">
                      [{id.format}] {id.angle}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
