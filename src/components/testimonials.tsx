"use client";

import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const testimonials = [
  {
    quote:
      "Can't believe I'm still using this. It's so addictive, I've forgotten what my family looks like. 10/10, would get trapped again.",
    name: 'A.I. generated user',
    title: 'Content Creator',
    avatar: 'AI',
    image: 'https://placehold.co/100x100.png',
  },
  {
    quote:
      "This app sucks the boring right out of my headlines. Now my titles are clickbait and I'm drowning in engagement. Thanks for nothing.",
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

export function Testimonials() {
  return (
    <section className="bg-card py-24 sm:py-32">
      <div className="container">
        <h2 className="text-center font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Why creators reluctantly love us
        </h2>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <Card key={testimonial.name} className="flex flex-col">
              <CardContent className="flex-1 pt-6">
                <p className="italic text-muted-foreground">
                  "{testimonial.quote}"
                </p>
              </CardContent>
              <CardHeader>
                <StarRating />
                <div className="flex items-center gap-4 pt-4">
                  <Avatar>
                    <AvatarImage
                      src={testimonial.image}
                      alt={testimonial.name}
                      data-ai-hint="profile picture"
                    />
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
  );
}
