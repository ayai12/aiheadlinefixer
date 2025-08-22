"use client";

import { useState, useEffect } from 'react';
import { generateHeadlineVariations } from '@/ai/flows/generate-headline-variations';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ArrowRight,
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
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

type Variation = {
  text: string;
  id: number;
};

const testimonials = [
  {
    quote: "Can't believe I'm still using this. It's so addictive, I've forgotten what my family looks like. 10/10, would get trapped again.",
    name: 'A.I. generated user',
    title: 'Content Creator',
    avatar: 'AI',
    image: 'https://placehold.co/100x100.png',
  },
  {
    quote: "This app sucks the boring right out of my headlines. Now my titles are clickbait and I'm drowning in engagement. Thanks for nothing.",
    name: 'Probably a real person',
    title: 'Social Media Manager',
    avatar: 'PR',
    image: 'https://placehold.co/100x100.png',
  },
  {
    quote: 'Great app bro.',
    name: 'ChatGPT',
    title: 'Definitely not a human',
    avatar: 'CG',
    image: 'https://placehold.co/100x100.png',
  },
];

const StarRating = ({ rating = 5 }: { rating?: number }) => (
  <div className="flex items-center gap-0.5 text-accent">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < rating ? 'fill-current' : 'text-muted-foreground/50'
        }`}
      />
    ))}
  </div>
);

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
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
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
                <div className="grid gap-4 md:grid-cols-2">
                  {variations.map((variation) => (
                    <Card
                      key={variation.id}
                      className="group flex flex-col justify-between transition-shadow hover:shadow-md"
                    >
                      <CardContent className="flex-grow p-4">
                        <p className="text-foreground">{variation.text}</p>
                      </CardContent>
                      <div className="flex justify-end gap-1 border-t bg-background/50 p-2">
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
                                : 'text-muted-foreground group-hover:text-foreground'
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
      
      <section className="bg-card py-24 sm:py-32">
        <div className="container">
          <h2 className="text-center font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Why creators reluctantly love us
          </h2>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
            {testimonials.map((testimonial, i) => (
              <Card key={testimonial.name} className="flex flex-col">
                <CardContent className="flex-1 pt-6">
                  <p className="italic text-muted-foreground">"{testimonial.quote}"</p>
                </CardContent>
                <CardHeader>
                  <StarRating />
                  <div className="flex items-center gap-4 pt-4">
                    <Avatar>
                      <AvatarImage src={testimonial.image} alt={testimonial.name} data-ai-hint="profile picture" />
                      <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base font-semibold">
                        {testimonial.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.title}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 text-center sm:py-32">
        <div className="container">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Fix boring headlines in 5 seconds.
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Our AI generates 10 viral-ready alternatives instantly.
            <br />
            Stop the scroll. Boost engagement. Get click-worthy headlines.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild size="lg" className="group animate-button-pulse">
              <Link href="/app">
                Try It Free
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">Like the results?</DialogTitle>
            <DialogDescription>
              Get more tools & templates. Sign up to get our best content toolkits, copywriting formulas, and AI pro features delivered to your inbox.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); toast({ title: "Subscribed!", description: "Thanks for joining our newsletter." })}}>
            <div className="grid flex-1 gap-2">
              <Label htmlFor="email" className="sr-only">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                required
              />
              <Button type="submit" className="w-full">
                Subscribe
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
