import { AppClient } from '@/components/app-client';

export default function HeadlineFixerPage() {
  return (
    <div className="container py-6">
      <h1 className="mb-4 font-headline text-2xl font-bold">AI Headline Fixer</h1>
      <AppClient />
    </div>
  );
}
