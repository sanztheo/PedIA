'use client';

import { PageStatus } from '@/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PageHeaderProps {
  title: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  status: PageStatus;
}

const statusConfig: Record<PageStatus, { label: string; className: string }> = {
  PUBLISHED: {
    label: 'Publié',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  DRAFT: {
    label: 'Brouillon',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  GENERATING: {
    label: 'En génération',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  ERROR: {
    label: 'Erreur',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
};

export function PageHeader({
  title,
  createdAt,
  updatedAt,
  viewCount,
  status,
}: PageHeaderProps) {
  const statusInfo = statusConfig[status];
  const createdDate = new Date(createdAt);
  const updatedDate = new Date(updatedAt);

  return (
    <div className="border-b bg-gradient-to-b from-background to-muted/30 py-8 px-6 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
              statusInfo.className
            )}
          >
            {statusInfo.label}
          </span>
        </div>

        <h1 className="mb-6 text-4xl font-bold leading-tight">
          {title}
        </h1>

        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-medium">Créé</span>
            <time dateTime={createdDate.toISOString()}>
              {formatDistanceToNow(createdDate, { addSuffix: true, locale: fr })}
            </time>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="font-medium">Modifié</span>
            <time dateTime={updatedDate.toISOString()}>
              {formatDistanceToNow(updatedDate, { addSuffix: true, locale: fr })}
            </time>
          </div>

          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>{viewCount.toLocaleString('fr-FR')} vues</span>
          </div>
        </div>
      </div>
    </div>
  );
}
