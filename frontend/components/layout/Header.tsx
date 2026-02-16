'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Mobile menu with Sheet drawer */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="size-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b border-border px-4 py-3">
              <SheetTitle className="flex items-center gap-2">
                <Image 
                  src="/logo/logo_no_bg.svg" 
                  alt="PedIA" 
                  width={28} 
                  height={28}
                  className="invert dark:invert-0"
                />
                PedIA
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
              <Sidebar />
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity"
        >
          <Image 
            src="/logo/logo_no_bg.svg" 
            alt="PedIA" 
            width={32} 
            height={32}
            className="invert dark:invert-0"
          />
          <span>PedIA</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/explore">Explorer</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/about">À propos</Link>
          </Button>
        </nav>

        {/* Spacer for mobile to center logo */}
        <div className="lg:hidden w-10" />
      </div>
    </header>
  );
}
