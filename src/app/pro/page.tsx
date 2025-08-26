import { CheckoutButton } from "@/components/payments/checkout-button";
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
          <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl">Creator Suite Pro</h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Unlock the full <span className="font-semibold">Creator Suite</span> — an all‑in‑one set of tools to supercharge your content workflow.
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-lg">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="font-headline text-3xl">Creator Suite Bundle</CardTitle>
              <CardDescription>All‑in‑one toolkit designed for creators.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-center text-5xl font-bold">$19<span className="text-lg text-muted-foreground"></span></p>
              <p className="mb-6 text-center text-5xl font-bold">one-time payment</p>
              <ul className="space-y-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="mr-3 h-5 w-5 flex-shrink-0 text-green-500" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 rounded-md bg-muted/50 p-4 text-left">
                <p className="mb-2 text-sm font-semibold">Bundle includes</p>
                <ul className="grid gap-2 text-sm text-muted-foreground">
                  <li>• AI Headline Fixer</li>
                  <li>• Hashtag Finder</li>
                  <li>• Carousel Maker</li>
                  <li>• Podcast Hooks</li>
                  <li>• Engagement Booster</li>
                  <li>• Trend Radar</li>
                  <li>• Caption & Hook Generator</li>
                  <li>• Brand Deal Pitch Builder</li>
                  <li>• Analytics & Post Optimizer</li>
                  <li>• Content Calendar & Planner</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <CheckoutButton />
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
