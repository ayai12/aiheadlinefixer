import { AppClient } from '@/components/app-client';
import { Testimonials } from '@/components/testimonials';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import logo from '@/logo/icon (3).png';

export default function Home() {
  return (
    <>
      <AppClient />
      <Testimonials />
      <section className="py-20 text-center sm:py-32">
        <div className="container">
          <div className="mb-6 flex justify-center">
            <Image src={logo} alt="Headline Optimizer logo" width={56} height={56} className="h-14 w-14 rounded" priority />
          </div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Fix boring headlines in 5 seconds.
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Our AI generates 5 viral-ready alternatives instantly.
            <br />
            Stop the scroll. Boost engagement. Get click-worthy headlines.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild size="lg" className="group animate-button-pulse">
              <Link href="/auth">
                Try It Free
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
