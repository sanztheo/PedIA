'use client';

import { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Source {
  url: string;
  title: string;
  domain: string;
}

interface SourcesPanelProps {
  sources: Source[];
  className?: string;
}

function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

export function SourcesPanel({ sources, className }: SourcesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (sources.length === 0) {
    return null;
  }

  const displayedSources = isExpanded ? sources : sources.slice(0, 3);
  const hasMore = sources.length > 3;

  return (
    <div className={cn('rounded-lg border border-border bg-card', className)}>
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Globe className="size-4 text-muted-foreground" />
          Sources
          <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {sources.length}
          </span>
        </h3>
      </div>

      <ul className="divide-y divide-border">
        {displayedSources.map((source, index) => (
          <li key={index}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getFaviconUrl(source.domain)}
                alt=""
                width={20}
                height={20}
                className="rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {source.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {source.domain}
                </p>
              </div>
              <ExternalLink className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="px-4 py-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="size-4 mr-1" />
                Réduire
              </>
            ) : (
              <>
                <ChevronDown className="size-4 mr-1" />
                Voir {sources.length - 3} sources de plus
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
