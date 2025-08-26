import { HashtagFinderClient } from '@/components/hashtag-finder-client';

export default function HashtagFinderPage() {
  return (
    <div className="container py-6">
      <h1 className="mb-4 font-headline text-2xl font-bold">Hashtag Finder</h1>
      <HashtagFinderClient />
    </div>
  );
}
