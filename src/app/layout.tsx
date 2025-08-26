import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { CreatorSuiteSidebar } from '@/components/creator-suite-sidebar';

export const metadata: Metadata = {
  title: 'Creator Suite',
  description: 'A sleek multi‑tool platform for creators: AI Headline Fixer, Hashtag Finder, Carousel Maker, Podcast Hooks, Engagement Booster, Trend Radar, Caption & Hook Generator, Brand Deal Pitch Builder, Analytics & Post Optimizer, and Content Calendar & Planner.',
  icons: [
    { rel: 'icon', url: '/favicon.ico' },
    { rel: 'icon', url: '/icon.png' },
    { rel: 'apple-touch-icon', url: '/apple-icon.png' },
  ],
  openGraph: {
    title: 'Creator Suite',
    description: 'Creator Suite: Headline Fixer + Hashtag Finder + Carousel Maker + Podcast Hooks + Engagement Booster + Trend Radar + Caption & Hook Generator + Brand Deal Pitch Builder + Analytics & Post Optimizer + Content Calendar & Planner.',
    images: ['/icon.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Creator Suite',
    description: 'Creator Suite: Headline Fixer + Hashtag Finder + Carousel Maker + Podcast Hooks + Engagement Booster + Trend Radar + Caption & Hook Generator + Brand Deal Pitch Builder + Analytics & Post Optimizer + Content Calendar & Planner.',
    images: ['/icon.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <SidebarProvider>
          <Sidebar>
            <CreatorSuiteSidebar />
          </Sidebar>
          <SidebarInset>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
