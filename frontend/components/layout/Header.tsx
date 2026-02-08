'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Menu, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MobileMenu = dynamic(() => import('./MobileMenu'), { 
  ssr: false,
  loading: () => (
    <Button variant="ghost" size="icon" className="lg:hidden">
      <Menu className="size-5" />
      <span className="sr-only">Menu</span>
    </Button>
  )
});

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-14 px-4">
        <MobileMenu />

        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity"
        >
          <Sparkles className="size-5 text-primary" />
          <span>PedIA</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/explore">Explorer</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/about">À propos</Link>
          </Button>
        </nav>

        <div className="lg:hidden w-10" />
      </div>
    </header>
  );
}
