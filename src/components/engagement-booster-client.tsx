"use client";

import { useState } from "react";
import { generateEngagementBoosters } from "@/ai/flows/generate-engagement-boosters";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Loader2, Sparkles, Copy, Download } from "lucide-react";

export function EngagementBoosterClient() {
  const [caption, setCaption] = useState("");
  const [contentType, setContentType] = useState<string | undefined>("post");
  const [platform, setPlatform] = useState<string | undefined>("instagram");
  const [audience, setAudience] = useState<string | undefined>("general");
  const [goal, setGoal] = useState<string | undefined>("comments");
  const [count, setCount] = useState<number>(8);

  const [ctas, setCtas] = useState<string[]>([]);
  const [polls, setPolls] = useState<{ question: string; options: string[] }[]>([]);
  const [prompts, setPrompts] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const DAILY_LIMIT = 20;
  const usageKeyDate = "engageUsageDate";
  const usageKeyCount = "engageUsageCount";

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
    if (!caption.trim()) {
      toast({ variant: "destructive", title: "Add a caption/topic", description: "Describe your post to get engagement ideas." });
      return;
    }
    const used = getUsage();
    if (used >= DAILY_LIMIT) {
      toast({ variant: "destructive", title: "Daily Limit Reached", description: `You've used ${used}/${DAILY_LIMIT} generations today.` });
      return;
    }

    setLoading(true);
    setCtas([]);
    setPolls([]);
    setPrompts([]);

    try {
      const res = await generateEngagementBoosters({
        caption,
        contentType: contentType as any,
        platform: platform as any,
        audience: audience as any,
        goal: goal as any,
        maxCount: count,
      });
      setCtas(res.ctas || []);
      setPolls(res.polls || []);
      setPrompts(res.prompts || []);
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

  const exportList = (filename: string, lines: string[], format: "txt" | "csv" = "txt") => {
    if (!lines.length) return;
    const content = format === "csv" ? `value\n${lines.map((v) => `"${v.replace(/"/g, '""')}"`).join("\n")}` : lines.join("\n");
    const blob = new Blob([content], { type: format === "csv" ? "text/csv;charset=utf-8;" : "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.${format}`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportPolls = (format: "txt" | "csv") => {
    if (!polls.length) return;
    if (format === "txt") {
      const lines = polls.flatMap((p, i) => [
        `Q${i + 1}: ${p.question}`,
        ...p.options.map((o, j) => `  ${j + 1}. ${o}`),
      ]);
      exportList("polls", lines, "txt");
    } else {
      const header = "question,options";
      const rows = polls.map((p) => `"${p.question.replace(/"/g, '""')}","${p.options.join(' / ').replace(/"/g, '""')}"`);
      const content = [header, ...rows].join("\n");
      const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `polls.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="overflow-hidden shadow-lg">
        <CardContent className="p-6">
          <div className="mb-2 flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            <h1 className="font-headline text-2xl font-bold">Engagement Booster</h1>
          </div>
          <p className="mb-4 text-muted-foreground">
            Get tailored CTAs, polls, and comment prompts to boost engagement for your post.
          </p>
          <div className="grid w-full gap-2">
            <Textarea
              placeholder="Paste your caption or describe your post/topic..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="text-base"
              aria-label="Caption Input"
            />

            <div className="rounded-lg border p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contentType">Content type</Label>
                  <Select onValueChange={(v) => setContentType(v)} value={contentType}>
                    <SelectTrigger id="contentType" aria-label="Content Type">
                      <SelectValue placeholder="post" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="post">Post</SelectItem>
                      <SelectItem value="reel">Reel</SelectItem>
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="carousel">Carousel</SelectItem>
                      <SelectItem value="story">Story</SelectItem>
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
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="twitter">Twitter/X</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
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
                  <Label htmlFor="goal">Goal</Label>
                  <Select onValueChange={(v) => setGoal(v)} value={goal}>
                    <SelectTrigger id="goal" aria-label="Goal">
                      <SelectValue placeholder="Comments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comments">Comments</SelectItem>
                      <SelectItem value="saves">Saves</SelectItem>
                      <SelectItem value="shares">Shares</SelectItem>
                      <SelectItem value="clicks">Clicks</SelectItem>
                      <SelectItem value="follows">Follows</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="count">How many each?</Label>
                  <Input
                    id="count"
                    type="number"
                    min={3}
                    max={25}
                    placeholder="8"
                    value={count}
                    onChange={(e) => setCount(e.target.value ? Math.min(25, Math.max(3, Number(e.target.value))) : 8)}
                  />
                </div>
              </div>

              <Separator />

              <Button onClick={handleGenerate} disabled={loading} size="lg">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Engagement Ideas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {(ctas.length > 0 || polls.length > 0 || prompts.length > 0) && (
        <div className="mt-6 space-y-6">
          {/* CTAs */}
          {ctas.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-headline text-xl font-bold">CTAs</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyText(ctas.join("\n"))}>
                    <Copy className="mr-2 h-4 w-4" /> Copy All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportList("ctas", ctas, "txt")}>
                    <Download className="mr-2 h-4 w-4" /> TXT
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportList("ctas", ctas, "csv")}>
                    <Download className="mr-2 h-4 w-4" /> CSV
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                {ctas.map((t, i) => (
                  <Card key={i} className="p-4 hover:bg-muted/40 cursor-pointer" onClick={() => copyText(t)} title="Click to copy">
                    {t}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Polls */}
          {polls.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-headline text-xl font-bold">Polls</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportPolls("txt")}>
                    <Download className="mr-2 h-4 w-4" /> TXT
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportPolls("csv")}>
                    <Download className="mr-2 h-4 w-4" /> CSV
                  </Button>
                </div>
              </div>
              <div className="grid gap-3">
                {polls.map((p, i) => (
                  <Card key={i} className="p-4">
                    <div className="font-medium">{p.question}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {p.options.map((o, j) => (
                        <Badge key={`${i}-${j}`} variant="secondary" className="rounded-full">
                          {o}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Prompts */}
          {prompts.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-headline text-xl font-bold">Comment Prompts</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyText(prompts.join("\n"))}>
                    <Copy className="mr-2 h-4 w-4" /> Copy All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportList("prompts", prompts, "txt")}>
                    <Download className="mr-2 h-4 w-4" /> TXT
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportList("prompts", prompts, "csv")}>
                    <Download className="mr-2 h-4 w-4" /> CSV
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                {prompts.map((t, i) => (
                  <Card key={i} className="p-4 hover:bg-muted/40 cursor-pointer" onClick={() => copyText(t)} title="Click to copy">
                    {t}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
