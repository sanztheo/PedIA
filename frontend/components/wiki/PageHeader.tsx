'use client';

import Link from 'next/link';
import { Network, Eye, Clock, CalendarDays } from 'lucide-react';
import { PageStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PageHeaderProps {
  title: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  status: PageStatus;
  pageId?: string;
}

const statusConfig: Record<PageStatus, { label: string; className: string; dot: string }> = {
  PUBLISHED: {
    label: 'Publié',
    className: 'text-green-400',
    dot: 'bg-green-400',
  },
  DRAFT: {
    label: 'Brouillon',
    className: 'text-yellow-400',
    dot: 'bg-yellow-400',
  },
  GENERATING: {
    label: 'En génération',
    className: 'text-blue-400',
    dot: 'bg-blue-400 animate-pulse',
  },
  ERROR: {
    label: 'Erreur',
    className: 'text-red-400',
    dot: 'bg-red-400',
  },
};

export function PageHeader({
  title,
  createdAt,
  updatedAt,
  viewCount,
  status,
  pageId,
}: PageHeaderProps) {
  const statusInfo = statusConfig[status];
  const createdDate = new Date(createdAt);
  const updatedDate = new Date(updatedAt);

  return (
    <header className="relative border-b border-border/50">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-transparent pointer-events-none" />
      
      <div className="relative px-8 lg:px-12 py-10 lg:py-14">
        {/* Top bar with status and actions */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className={cn('size-2 rounded-full', statusInfo.dot)} />
            <span className={cn('text-sm font-medium', statusInfo.className)}>
              {statusInfo.label}
            </span>
          </div>

          {pageId && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground gap-2"
              asChild
            >
              <Link href={`/explore?page=${pageId}`}>
                <Network className="size-4" />
                <span className="hidden sm:inline">Graphe</span>
              </Link>
            </Button>
          )}
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-8 text-foreground">
          {title}
        </h1>

        {/* Meta information */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground/60" />
            <span>Créé</span>
            <time dateTime={createdDate.toISOString()} className="text-foreground/70">
              {formatDistanceToNow(createdDate, { addSuffix: true, locale: fr })}
            </time>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground/60" />
            <span>Modifié</span>
            <time dateTime={updatedDate.toISOString()} className="text-foreground/70">
              {formatDistanceToNow(updatedDate, { addSuffix: true, locale: fr })}
            </time>
          </div>

          <div className="flex items-center gap-2">
            <Eye className="size-4 text-muted-foreground/60" />
            <span className="text-foreground/70">{viewCount.toLocaleString('fr-FR')} vues</span>
          </div>
        </div>
      </div>
    </header>
  );
}
