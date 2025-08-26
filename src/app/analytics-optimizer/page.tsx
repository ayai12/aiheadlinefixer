import { AnalyticsOptimizerClient } from '@/components/analytics-optimizer-client';

export default function AnalyticsOptimizerPage() {
  return (
    <div className="container py-6">
      <h1 className="mb-4 font-headline text-2xl font-bold">Analytics & Post Optimizer</h1>
      <AnalyticsOptimizerClient />
    </div>
  );
}
