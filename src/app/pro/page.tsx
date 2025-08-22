import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const features = [
  "Advanced AI model for even better headlines",
  "Tone & Style adjustments (e.g., Professional, Witty, Casual)",
  "Audience-specific suggestions (e.g., for Marketers, Developers)",
  "Unlimited history and cloud-saved favorites",
  "Export to Notion, Google Docs, and more",
];

export default function ProPage() {
  return (
    <div className="bg-card py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl">
            Unlock Your Full Potential
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Go beyond basic headlines. Our Pro plan gives you advanced tools to craft the perfect message for any audience.
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-lg">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="font-headline text-3xl">Pro Bundle</CardTitle>
              <CardDescription>Everything you need to level up your content game.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-center text-5xl font-bold">$19<span className="text-lg text-muted-foreground">/month</span></p>
              <ul className="space-y-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="mr-3 h-5 w-5 flex-shrink-0 text-green-500" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button size="lg" className="w-full">Get Started with Pro</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
