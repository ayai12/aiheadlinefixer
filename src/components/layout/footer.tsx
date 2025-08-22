export function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex h-24 flex-col items-center justify-center gap-4 md:h-28 md:flex-row">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Headline Optimizer. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
