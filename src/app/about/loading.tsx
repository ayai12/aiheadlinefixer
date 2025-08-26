import Image from 'next/image';
import logo from '@/logo/icon (3).png';

export default function Loading() {
  return (
    <div className="container py-12 sm:py-24">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="mb-6 flex justify-center">
          <Image src={logo} alt="Logo" width={40} height={40} className="h-10 w-10 rounded" />
        </div>
        <div className="animate-pulse h-8 w-2/3 rounded bg-muted" />
        <div className="animate-pulse h-4 w-full rounded bg-muted" />
        <div className="animate-pulse h-4 w-5/6 rounded bg-muted" />
        <div className="animate-pulse h-4 w-4/5 rounded bg-muted" />
      </div>
    </div>
  );
}
