import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const testimonials = [
  {
    quote:
      "This tool is a game-changer. I went from spending 30 minutes on a headline to 30 seconds. My click-through rates have never been better!",
    name: 'Sarah L.',
    title: 'Blogger & Newsletter Writer',
    avatar: 'SL',
    image: 'https://placehold.co/100x100.png',
  },
  {
    quote:
      "As a social media manager, viral-ready headlines are everything. Headline Optimizer consistently delivers fresh ideas that stop the scroll. An essential tool in my kit.",
    name: 'Mike R.',
    title: 'Social Media Manager',
    avatar: 'MR',
    image: 'https://placehold.co/100x100.png',
  },
  {
    quote:
      "I was skeptical at first, but the AI-generated variations are surprisingly creative and effective. It's like having a brainstorming partner on demand.",
    name: 'Jessica P.',
    title: 'Content Marketer',
    avatar: 'JP',
    image: 'https://placehold.co/100x100.png',
  },
];

export default function Home() {
  return (
    <>
      <section className="py-20 text-center sm:py-32">
        <div className="container">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Fix boring headlines in 5 seconds.
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Free AI tool that generates 10 viral-ready alternatives instantly.
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

      <section className="bg-card py-24 sm:py-32">
        <div className="container">
          <h2 className="text-center font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Trusted by content creators everywhere
          </h2>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
            {testimonials.map((testimonial, i) => (
              <Card key={testimonial.name} className={i > 0 ? 'hidden md:block' : ''}>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">"{testimonial.quote}"</p>
                </CardContent>
                <CardHeader>
                  <div className="flex items-center gap-4">
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
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Get more tools & templates.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Sign up to get our best content toolkits, copywriting formulas, and
            AI pro features delivered to your inbox.
          </p>
          <form className="mx-auto mt-8 flex max-w-md items-center justify-center gap-x-2">
            <Input
              type="email"
              placeholder="Enter your email"
              className="flex-1"
              aria-label="Email address"
            />
            <Button type="submit">Subscribe</Button>
          </form>
        </div>
      </section>
    </>
  );
}
