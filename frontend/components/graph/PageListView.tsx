'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { GraphData, GraphNode } from '@/types';

interface PageListViewProps {
  data: GraphData;
  highlightedId?: string;
}

interface GroupedPages {
  [letter: string]: (GraphNode & { type: 'page' })[];
}

export function PageListView({ data, highlightedId }: PageListViewProps) {
  // Filter only page nodes and sort by name
  const pages = data.nodes
    .filter((node): node is GraphNode & { type: 'page' } => node.type === 'page')
    .sort((a, b) => a.label.localeCompare(b.label, 'fr'));

  // Group pages by first letter
  const groupedPages = pages.reduce<GroupedPages>((acc, page) => {
    const firstChar = page.label.charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(firstChar) ? firstChar : '#';
    if (!acc[letter]) {
      acc[letter] = [];
    }
    acc[letter].push(page);
    return acc;
  }, {});

  // Sort letters alphabetically, with # at the end
  const sortedLetters = Object.keys(groupedPages).sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  });

  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Aucune page trouvée
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="max-w-3xl mx-auto px-6 py-6">
        {sortedLetters.map((letter) => (
          <div key={letter} className="mb-6">
            {/* Letter Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 pb-2 mb-2">
              <h2 className="text-lg font-semibold text-foreground/80">
                {letter}
              </h2>
            </div>
            
            {/* Pages in this group */}
            <div className="space-y-0.5">
              {groupedPages[letter].map((page) => (
                <Link
                  key={page.id}
                  href={`/wiki/${page.slug}`}
                  className={`
                    group flex items-center justify-between py-2 px-3 rounded-md
                    transition-colors hover:bg-muted/50
                    ${highlightedId === page.id ? 'bg-primary/10' : ''}
                  `}
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {page.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground ml-4">
                    {page.metadata?.viewCount !== undefined && (
                      <span className="flex items-center gap-1 text-xs">
                        <Eye className="size-3" />
                        {page.metadata.viewCount}
                      </span>
                    )}
                    <ChevronRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
