"use client";

import { useState } from "react";
import { generateContentCalendar } from "@/ai/flows/generate-content-calendar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CalendarClock, Loader2, Sparkles, Copy, Download, CheckSquare } from "lucide-react";

interface Item { date: string; platform: string; idea: string; format: string; captionPrompt: string; reminder: string }

export function ContentCalendarClient() {
  const [niche, setNiche] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["instagram", "tiktok", "youtube"]);
  const [postsPerWeek, setPostsPerWeek] = useState<number>(7);
  const [weeks, setWeeks] = useState<number>(4);
  const [startDate, setStartDate] = useState<string>("");
  const [region, setRegion] = useState<string>("");

  const [summary, setSummary] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const DAILY_LIMIT = 8;
  const usageKeyDate = "calendarUsageDate";
  const usageKeyCount = "calendarUsageCount";

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
      toast({ variant: "destructive", title: "Add a niche", description: "Tell us your content niche." });
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
    setSummary("");
    setItems([]);

    try {
      const res = await generateContentCalendar({
        niche,
        platforms,
        postsPerWeek,
        weeks,
        startDate: startDate || undefined,
        region: region || undefined,
      });
      setSummary(res.summary || "");
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
    const lines = [summary ? `SUMMARY: ${summary}` : "", "", ...items.map((it, i) => `${i + 1}. ${it.date} — ${it.platform} [${it.format}]\nIdea: ${it.idea}\nCaption prompt: ${it.captionPrompt}\nReminder: ${it.reminder}`)].join("\n");
    copyText(lines);
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
    if (!items.length) return;
    const lines: string[] = [];
    if (summary) lines.push("SUMMARY:", summary, "");
    items.forEach((it, i) => {
      lines.push(`${i + 1}. ${it.date} — ${it.platform} [${it.format}]`);
      lines.push(`   Idea: ${it.idea}`);
      lines.push(`   Caption prompt: ${it.captionPrompt}`);
      lines.push(`   Reminder: ${it.reminder}`);
    });
    download("content-calendar.txt", lines.join("\n"), "text/plain;charset=utf-8;");
  };

  const exportCsv = () => {
    if (!items.length) return;
    const header = "date,platform,format,idea,captionPrompt,reminder";
    const rows = items.map((it) => [it.date, it.platform, it.format, it.idea, it.captionPrompt, it.reminder].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const content = [header, ...rows].join("\n");
    download("content-calendar.csv", content, "text/csv;charset=utf-8;");
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="overflow-hidden shadow-lg">
        <CardContent className="p-6">
          <div className="mb-2 flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-primary" />
            <h1 className="font-headline text-2xl font-bold">Content Calendar & Planner</h1>
          </div>
          <p className="mb-4 text-muted-foreground">
            Build a content calendar with post ideas, reminders, and cross-platform scheduling.
          </p>

          <div className="grid w-full gap-3">
            <Textarea
              placeholder="Describe your niche (e.g., frontend dev tips, mindfulness coach)"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              rows={3}
              className="text-base"
            />

            <div className="rounded-lg border p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
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
                        <Button key={p.key} type="button" variant={active ? "default" : "outline"} size="sm" onClick={() => togglePlatform(p.key)}>
                          <CheckSquare className="mr-2 h-4 w-4" /> {p.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postsPerWeek">Posts per week</Label>
                  <Input
                    id="postsPerWeek"
                    type="number"
                    min={1}
                    max={21}
                    value={postsPerWeek}
                    onChange={(e) => setPostsPerWeek(e.target.value ? Math.min(21, Math.max(1, Number(e.target.value))) : 7)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weeks">Weeks</Label>
                  <Input
                    id="weeks"
                    type="number"
                    min={1}
                    max={12}
                    value={weeks}
                    onChange={(e) => setWeeks(e.target.value ? Math.min(12, Math.max(1, Number(e.target.value))) : 4)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start date (optional)</Label>
                  <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region/Timezone (optional)</Label>
                  <Input id="region" placeholder="Global, US/Eastern, UK..." value={region} onChange={(e) => setRegion(e.target.value)} />
                </div>
              </div>

              <Separator />

              <Button onClick={handleGenerate} disabled={loading} size="lg">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Build Calendar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-headline text-xl font-bold">Planned Posts</h2>
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
                <div className="font-semibold">{it.date} — {it.platform} [{it.format}]</div>
                <div className="mt-1 text-sm text-muted-foreground">Idea: {it.idea}</div>
                <div className="mt-1 text-sm text-muted-foreground">Caption prompt: {it.captionPrompt}</div>
                <div className="mt-1 text-sm text-muted-foreground">Reminder: {it.reminder}</div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
