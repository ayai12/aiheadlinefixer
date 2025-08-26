import { ContentCalendarClient } from '@/components/content-calendar-client';

export default function ContentCalendarPage() {
  return (
    <div className="container py-6">
      <h1 className="mb-4 font-headline text-2xl font-bold">Content Calendar & Planner</h1>
      <ContentCalendarClient />
    </div>
  );
}
