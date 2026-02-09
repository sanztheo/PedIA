'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { EntitySidebar } from './EntitySidebar';
import type { Entity } from '@/types';

interface MobileEntitiesButtonProps {
  entities: Entity[];
}

export function MobileEntitiesButton({ entities }: MobileEntitiesButtonProps) {
  const [open, setOpen] = useState(false);

  if (entities.length === 0) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="fixed bottom-6 right-6 xl:hidden shadow-lg gap-2 z-50"
        >
          <Users className="size-4" />
          Entités
          <Badge variant="secondary" className="ml-1 bg-primary/20 text-primary">
            {entities.length}
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>Entités liées</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto h-[calc(100vh-80px)]">
          <EntitySidebar entities={entities} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
