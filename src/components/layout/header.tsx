import Link from 'next/link';
import Image from 'next/image';
import { AuthActions } from '@/components/auth-actions';
import { SidebarTrigger } from '@/components/ui/sidebar';
import logo from '@/logo/icon (3).png';

const NavLink = ({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <Link
    href={href}
    className={`text-muted-foreground transition-colors hover:text-foreground ${className}`}
  >
    {children}
  </Link>
);

export function Header() {
  const navItems = [
    { href: '/headline-fixer', label: 'App' },
    { href: '/about', label: 'About' },
    { href: '/faq', label: 'FAQ' },
    { href: '/pro', label: 'Go Pro' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Mobile: Sidebar trigger */}
        <div className="md:hidden mr-2">
          <SidebarTrigger />
        </div>

        <div className="mr-4 hidden md:flex items-center">
          <SidebarTrigger className="mr-2" />
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image
              src={logo}
              alt="Creator Suite logo"
              width={28}
              height={28}
              className="h-7 w-7 rounded"
              priority
            />
            <span className="font-headline font-bold">Creator Suite</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <AuthActions />
        </div>
      </div>
    </header>
  );
}
