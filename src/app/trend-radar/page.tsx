import { TrendRadarClient } from '@/components/trend-radar-client';

export default function TrendRadarPage() {
  return (
    <div className="container py-6">
      <h1 className="mb-4 font-headline text-2xl font-bold">Trend Radar</h1>
      <TrendRadarClient />
    </div>
  );
}
