import { PodcastHooksClient } from '@/components/podcast-hooks-client';

export default function PodcastHooksPage() {
  return (
    <div className="container py-6">
      <h1 className="mb-4 font-headline text-2xl font-bold">Podcast Hooks</h1>
      <PodcastHooksClient />
    </div>
  );
}
