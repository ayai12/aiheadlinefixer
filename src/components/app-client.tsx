"use client";

import { useState, useEffect } from 'react';
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

  const handleGenerate = async () => {
    if (!headline.trim()) {
      setError('Please enter a headline to optimize.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setVariations([]);

    try {
      const result = await generateHeadlineVariations({ headline });
      setVariations(result.variations.map((v, i) => ({ text: v, id: i })));
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
    setFavorites((prev) =>
      prev.includes(text)
        ? prev.filter((fav) => fav !== text)
        : [...prev, text]
    );
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

  return (
    <>
      <div className="container py-12 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <Card className="overflow-hidden shadow-lg">
            <CardContent className="p-6">
              <div className="mb-2 flex items-center gap-2">
                <Wand2 className="h-6 w-6 text-primary" />
                <h1 className="font-headline text-2xl font-bold">
                  AI Headline Fixer
                </h1>
              </div>
              <p className="mb-4 text-muted-foreground">
                Enter your headline below and we'll generate 10 click-worthy
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
                <Button onClick={handleGenerate} disabled={isLoading} size="lg">
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Fix my headline
                </Button>
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
                {[...Array(10)].map((_, i) => (
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
                  </div>
                </div>
                <div className="space-y-3">
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
