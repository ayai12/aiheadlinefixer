import { CaptionHookGeneratorClient } from '@/components/caption-hook-generator-client';

export default function CaptionHookGeneratorPage() {
  return (
    <div className="container py-6">
      <h1 className="mb-4 font-headline text-2xl font-bold">Caption & Hook Generator</h1>
      <CaptionHookGeneratorClient />
    </div>
  );
}
