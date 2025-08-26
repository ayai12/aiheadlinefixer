import { BrandPitchBuilderClient } from '@/components/brand-pitch-builder-client';

export default function BrandPitchBuilderPage() {
  return (
    <div className="container py-6">
      <h1 className="mb-4 font-headline text-2xl font-bold">Brand Deal Pitch Builder</h1>
      <BrandPitchBuilderClient />
    </div>
  );
}
