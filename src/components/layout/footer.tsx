import Image from 'next/image';
import logo from '@/logo/icon (3).png';

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex h-24 flex-col items-center justify-between gap-4 md:h-28 md:flex-row">
        <div className="flex items-center gap-2">
          <Image
            src={logo}
            alt="Headline Optimizer logo"
            width={20}
            height={20}
            className="h-5 w-5 rounded"
          />
          <span className="font-headline font-bold">Headline Optimizer</span>
        </div>
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Headline Optimizer. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
