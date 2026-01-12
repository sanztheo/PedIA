'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Compass, Search, ChevronRight, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GraphView } from '@/components/graph/GraphView';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import type { GraphData, Page } from '@/types';

export function Sidebar() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });

  useEffect(() => {
    async function fetchData() {
      try {
        const [pagesRes, graphRes] = await Promise.all([
          api.pages.list({ limit: 5 }),
          api.graph.full({ limit: 20 }),
        ]);

        if (pagesRes.data?.data) {
          setPages(pagesRes.data.data);
        }

        if (graphRes.data) {
          setGraphData(graphRes.data);
        }
      } catch {
        // Silently fail - sidebar will show empty state
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const [showGraph, setShowGraph] = useState(true);

  return (
    <div className="h-full bg-background p-4 space-y-6">
      {/* Navigation Section */}
      <nav className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-3">
          Navigation
        </p>
        <NavButton href="/" icon={Home}>Accueil</NavButton>
        <NavButton href="/explore" icon={Compass}>Explorer</NavButton>
        <NavButton href="/search" icon={Search}>Rechercher</NavButton>
      </nav>

      <div className="border-t border-border" />

      {/* Recent Pages Section */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
          Pages récentes
        </p>
        <div className="space-y-0.5">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-2 py-1.5">
                <div className="h-4 bg-muted rounded animate-pulse" />
              </div>
            ))
          ) : pages.length > 0 ? (
            pages.map((page) => (
              <Link
                key={page.id}
                href={`/wiki/${page.slug}`}
                className={cn(
                  "group flex items-center gap-2 px-2 py-1.5 rounded-md text-sm",
                  "text-muted-foreground hover:text-foreground",
                  "hover:bg-accent transition-colors"
                )}
              >
                <span className="truncate flex-1">{page.title}</span>
                <ChevronRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))
          ) : (
            <p className="px-2 text-sm text-muted-foreground">
              Aucune page
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Graph Section */}
      <div className="space-y-2">
        <button
          onClick={() => setShowGraph(!showGraph)}
          className="flex items-center gap-2 px-2 w-full text-left"
        >
          <Network className="size-4 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">
            Graphe
          </p>
          <ChevronRight className={cn(
            "size-4 text-muted-foreground transition-transform",
            showGraph && "rotate-90"
          )} />
        </button>

        {showGraph && (
          <div className="rounded-lg overflow-hidden border border-border">
            <GraphView
              data={graphData}
              width={224}
              height={180}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for nav buttons
function NavButton({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Button variant="ghost" size="sm" className="w-full justify-start gap-2" asChild>
      <Link href={href}>
        <Icon className="size-4" />
        <span>{children}</span>
      </Link>
    </Button>
  );
}
