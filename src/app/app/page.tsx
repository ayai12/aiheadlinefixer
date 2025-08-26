import Link from 'next/link';

// Redirect to the homepage where the app now lives.
export default function AppPage() {
  return (
    <div className="container flex h-full min-h-[50vh] flex-col items-center justify-center py-12 text-center">
      <h1 className="font-headline text-3xl font-bold">The App has moved!</h1>
      <p className="mt-4 max-w-prose text-muted-foreground">
        The Headline Fixer now lives in the <span className="font-semibold">Creator Suite</span>.
      </p>
      <Link href="/headline-fixer" className="mt-6 rounded-md bg-primary px-6 py-2 text-primary-foreground">
        Go to Headline Fixer
      </Link>
    </div>
  );
}
