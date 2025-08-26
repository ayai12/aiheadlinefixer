"use client";

import { useState } from "react";
import { generateHashtags } from "@/ai/flows/generate-hashtags";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Hash, Loader2, Sparkles, Copy, Download } from "lucide-react";

export function HashtagFinderClient() {
  const [caption, setCaption] = useState("");
  const [platform, setPlatform] = useState<string | undefined>(undefined);
  const [includeText, setIncludeText] = useState("");
  const [excludeText, setExcludeText] = useState("");
  const [count, setCount] = useState<number>(20);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const DAILY_LIMIT = 20;
  const usageKeyDate = "hashtagUsageDate";
  const usageKeyCount = "hashtagUsageCount";

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

  const parseKeywords = (s: string) =>
    s
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

  const handleGenerate = async () => {
    if (!caption.trim()) {
      toast({ variant: "destructive", title: "Add a caption", description: "Describe your post to get hashtags." });
      return;
    }
    const used = getUsage();
    if (used >= DAILY_LIMIT) {
      toast({ variant: "destructive", title: "Daily Limit Reached", description: `You've used ${used}/${DAILY_LIMIT} generations today.` });
      return;
    }
    setLoading(true);
    setTags([]);
    try {
      const includes = parseKeywords(includeText);
      const excludes = parseKeywords(excludeText);
      const res = await generateHashtags({
        caption,
        platform: platform as any,
        includeKeywords: includes.length ? includes : undefined,
        excludeKeywords: excludes.length ? excludes : undefined,
        maxCount: count,
      });
      setTags(res.hashtags);
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
    } catch (e) {
      toast({ variant: "destructive", title: "Copy failed" });
    }
  };

  const copyAll = async () => {
    try {
      const text = tags.join(" ");
      await navigator.clipboard.writeText(text);
      toast({ title: "All hashtags copied" });
    } catch {
      toast({ variant: "destructive", title: "Copy failed" });
    }
  };

  const exportToFile = (format: "txt" | "csv") => {
    if (tags.length === 0) return;
    const content =
      format === "csv"
        ? `hashtag\n${tags.map((v) => `"${v.replace(/"/g, '""')}"`).join("\n")}`
        : tags.join(" ");
    const blob = new Blob([content], { type: format === "csv" ? "text/csv;charset=utf-8;" : "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `hashtags.${format}`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <>
      <div className="mx-auto max-w-3xl">
        <Card className="overflow-hidden shadow-lg">
          <CardContent className="p-6">
            <div className="mb-2 flex items-center gap-2">
              <Hash className="h-6 w-6 text-primary" />
              <h1 className="font-headline text-2xl font-bold">Hashtag Finder</h1>
            </div>
            <p className="mb-4 text-muted-foreground">
              Describe your post and get a balanced set of popular, medium, and niche hashtags.
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
                    <Label htmlFor="platform">Platform</Label>
                    <Select onValueChange={(v) => setPlatform(v)} value={platform}>
                      <SelectTrigger id="platform" aria-label="Platform">
                        <SelectValue placeholder="Any" />
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
                    <Label htmlFor="count">How many?</Label>
                    <Input
                      id="count"
                      type="number"
                      min={5}
                      max={50}
                      placeholder="20"
                      value={count}
                      onChange={(e) => setCount(e.target.value ? Math.min(50, Math.max(5, Number(e.target.value))) : 20)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="include">Prefer including (comma-separated)</Label>
                    <Input
                      id="include"
                      placeholder="e.g., marketing, growth"
                      value={includeText}
                      onChange={(e) => setIncludeText(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exclude">Avoid (comma-separated)</Label>
                    <Input
                      id="exclude"
                      placeholder="e.g., spam, follow4follow"
                      value={excludeText}
                      onChange={(e) => setExcludeText(e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <Button onClick={handleGenerate} disabled={loading} size="lg">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generate Hashtags
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {tags.length > 0 && (
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
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="rounded-full cursor-pointer" onClick={() => copyOne(t)} title="Click to copy">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
