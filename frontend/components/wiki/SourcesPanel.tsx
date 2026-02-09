'use client';

import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Source {
  url: string;
  title: string;
  domain: string;
}

interface SourcesPanelProps {
  sources: Source[];
}

export function SourcesPanel({ sources }: SourcesPanelProps) {
  const [expanded, setExpanded] = useState(false);
  
  if (sources.length === 0) {
    return null;
  }

  const displayedSources = expanded ? sources : sources.slice(0, 3);

  return (
    <div className="border rounded-lg bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <span className="size-5 rounded bg-blue-500/20 flex items-center justify-center text-blue-500 text-xs">
            {sources.length}
          </span>
          Sources utilisées
        </h3>
      </div>

      <ul className="space-y-2">
        {displayedSources.map((source, index) => (
          <li key={index}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-start gap-2 p-2 rounded-md -mx-2',
                'hover:bg-background/50 transition-colors group'
              )}
            >
              <ExternalLink className="size-4 text-muted-foreground mt-0.5 shrink-0 group-hover:text-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate group-hover:text-foreground">
                  {source.title || source.domain}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {source.domain}
                </p>
              </div>
            </a>
          </li>
        ))}
      </ul>

      {sources.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 w-full justify-center pt-2 border-t"
        >
          {expanded ? (
            <>
              <ChevronUp className="size-3" />
              Voir moins
            </>
          ) : (
            <>
              <ChevronDown className="size-3" />
              Voir {sources.length - 3} sources de plus
            </>
          )}
        </button>
      )}
    </div>
  );
}
