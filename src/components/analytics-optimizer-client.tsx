"use client";

import { useState } from "react";
import { generateAnalyticsOptimizer } from "@/ai/flows/generate-analytics-optimizer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Loader2, Sparkles, Copy, Download, ListChecks } from "lucide-react";

interface Idea { idea: string; format: string; why: string }

export function AnalyticsOptimizerClient() {
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState<string | undefined>("instagram");
  const [region, setRegion] = useState<string | undefined>("");
  const [goal, setGoal] = useState<string | undefined>("reach");
  const [pastText, setPastText] = useState("");
  const [countKeywords, setCountKeywords] = useState<number>(12);
  const [countIdeas, setCountIdeas] = useState<number>(6);

  const [analysisSummary, setAnalysisSummary] = useState("");
  const [bestTimes, setBestTimes] = useState<string[]>([]);
  const [bestFormats, setBestFormats] = useState<string[]>([]);
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
  const [postIdeas, setPostIdeas] = useState<Idea[]>([]);

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const DAILY_LIMIT = 12;
  const usageKeyDate = "analyticsUsageDate";
  const usageKeyCount = "analyticsUsageCount";

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
      toast({ variant: "destructive", title: "Add a niche", description: "Describe your content niche." });
      return;
    }
    const used = getUsage();
    if (used >= DAILY_LIMIT) {
      toast({ variant: "destructive", title: "Daily Limit Reached", description: `You've used ${used}/${DAILY_LIMIT} generations today.` });
      return;
    }

    setLoading(true);
    setAnalysisSummary("");
    setBestTimes([]);
    setBestFormats([]);
    setKeywordSuggestions([]);
    setPostIdeas([]);

    try {
      const res = await generateAnalyticsOptimizer({
        niche,
        platform: platform as any,
        region: region || undefined,
        goal: goal as any,
        pastText: pastText || undefined,
        countKeywords,
        countIdeas,
      });
      setAnalysisSummary(res.analysisSummary || "");
      setBestTimes(res.bestTimes || []);
      setBestFormats(res.bestFormats || []);
      setKeywordSuggestions(res.keywordSuggestions || []);
      setPostIdeas(res.postIdeas || []);
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
    const lines: string[] = [];
    if (analysisSummary) lines.push("ANALYSIS SUMMARY:", analysisSummary, "");
    if (bestTimes.length) lines.push("BEST TIMES:", ...bestTimes.map((t) => `- ${t}`), "");
    if (bestFormats.length) lines.push("BEST FORMATS:", ...bestFormats.map((t) => `- ${t}`), "");
    if (keywordSuggestions.length) lines.push("KEYWORDS:", keywordSuggestions.join(", "), "");
    if (postIdeas.length) {
      lines.push("POST IDEAS:");
      postIdeas.forEach((p, i) => lines.push(`${i + 1}. ${p.idea} [${p.format}] — ${p.why}`));
    }
    copyText(lines.join("\n"));
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
    if (analysisSummary) lines.push("ANALYSIS SUMMARY:", analysisSummary, "");
    if (bestTimes.length) lines.push("BEST TIMES:", ...bestTimes.map((t) => `- ${t}`), "");
    if (bestFormats.length) lines.push("BEST FORMATS:", ...bestFormats.map((t) => `- ${t}`), "");
    if (keywordSuggestions.length) lines.push("KEYWORDS:", keywordSuggestions.join(", "));
    if (postIdeas.length) {
      lines.push("", "POST IDEAS:");
      postIdeas.forEach((p, i) => lines.push(`${i + 1}. ${p.idea} [${p.format}] — ${p.why}`));
    }
    download("analytics-optimizer.txt", lines.join("\n"), "text/plain;charset=utf-8;");
  };

  const exportCsv = () => {
    const header = "type,value";
    const rows: string[] = [];
    bestTimes.forEach((t) => rows.push(["bestTime", t].map((v) => `"${v.replace(/"/g, '""')}"`).join(",")));
    bestFormats.forEach((t) => rows.push(["bestFormat", t].map((v) => `"${v.replace(/"/g, '""')}"`).join(",")));
    keywordSuggestions.forEach((t) => rows.push(["keyword", t].map((v) => `"${v.replace(/"/g, '""')}"`).join(",")));
    postIdeas.forEach((p) => rows.push(["postIdea", `${p.idea} [${p.format}] — ${p.why}`].map((v) => `"${v.replace(/"/g, '""')}"`).join(",")));
    const content = [header, ...rows].join("\n");
    download("analytics-optimizer.csv", content, "text/csv;charset=utf-8;");
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="overflow-hidden shadow-lg">
        <CardContent className="p-6">
          <div className="mb-2 flex items-center gap-2">
            <LineChart className="h-6 w-6 text-primary" />
            <h1 className="font-headline text-2xl font-bold">Analytics & Post Optimizer</h1>
          </div>
          <p className="mb-4 text-muted-foreground">
            Analyze your past content context and get suggestions for best times, formats, keywords, and post ideas.
          </p>

          <div className="grid w-full gap-2">
            <Textarea
              placeholder="Add any notes about past content performance (optional)"
              value={pastText}
              onChange={(e) => setPastText(e.target.value)}
              rows={3}
              className="text-base"
              aria-label="Past content notes"
            />

            <div className="rounded-lg border p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="niche">Niche</Label>
                  <Input id="niche" placeholder="e.g., AI marketing" value={niche} onChange={(e) => setNiche(e.target.value)} />
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
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="twitter">Twitter/X</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region/Timezone</Label>
                  <Input id="region" placeholder="Global, US/Eastern, UK..." value={region} onChange={(e) => setRegion(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal">Goal</Label>
                  <Select onValueChange={(v) => setGoal(v)} value={goal}>
                    <SelectTrigger id="goal" aria-label="Goal">
                      <SelectValue placeholder="Reach" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reach">Reach</SelectItem>
                      <SelectItem value="engagement">Engagement</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                      <SelectItem value="conversions">Conversions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Keyword suggestions</Label>
                  <Input
                    id="keywords"
                    type="number"
                    min={5}
                    max={25}
                    value={countKeywords}
                    onChange={(e) => setCountKeywords(e.target.value ? Math.min(25, Math.max(5, Number(e.target.value))) : 12)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ideas">Post ideas</Label>
                  <Input
                    id="ideas"
                    type="number"
                    min={3}
                    max={15}
                    value={countIdeas}
                    onChange={(e) => setCountIdeas(e.target.value ? Math.min(15, Math.max(3, Number(e.target.value))) : 6)}
                  />
                </div>
              </div>

              <Separator />

              <Button onClick={handleGenerate} disabled={loading} size="lg">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Analyze & Optimize
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {(analysisSummary || bestTimes.length || bestFormats.length || keywordSuggestions.length || postIdeas.length) && (
        <div className="mt-6 space-y-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-headline text-xl font-bold">Recommendations</h2>
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

          {analysisSummary && (
            <Card className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                <div className="font-semibold">Summary</div>
              </div>
              <div className="text-sm text-muted-foreground">{analysisSummary}</div>
            </Card>
          )}

          {bestTimes.length ? (
            <Card className="p-4">
              <div className="mb-2 font-semibold">Best Times</div>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {bestTimes.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </Card>
          ) : null}

          {bestFormats.length ? (
            <Card className="p-4">
              <div className="mb-2 font-semibold">Best Formats</div>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {bestFormats.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </Card>
          ) : null}

          {keywordSuggestions.length ? (
            <Card className="p-4">
              <div className="mb-2 font-semibold">Keywords</div>
              <div className="text-sm text-muted-foreground">{keywordSuggestions.join(", ")}</div>
            </Card>
          ) : null}

          {postIdeas.length ? (
            <Card className="p-4">
              <div className="mb-2 font-semibold">Post Ideas</div>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {postIdeas.map((p, i) => (
                  <li key={i}>{p.idea} [{p.format}] — {p.why}</li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
