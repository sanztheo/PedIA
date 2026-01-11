'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home, Compass, Search, ChevronRight, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GraphView } from '@/components/graph/GraphView';
import { cn } from '@/lib/utils';
import type { GraphData } from '@/types';

export function Sidebar() {
  // TODO: Fetch from api.pages.list() instead of hardcoded data
  const pagesRecentes = [
    { id: 1, title: 'Intelligence Artificielle', slug: 'intelligence-artificielle' },
    { id: 2, title: 'Apprentissage Automatique', slug: 'apprentissage-automatique' },
    { id: 3, title: 'Réseaux de Neurones', slug: 'reseaux-de-neurones' },
    { id: 4, title: 'Apprentissage Profond', slug: 'apprentissage-profond' },
    { id: 5, title: 'Traitement du Langage', slug: 'traitement-langage-naturel' },
  ];

  // Demo graph data - TODO: Fetch from API
  const [graphData] = useState<GraphData>({
    nodes: [
      { id: '1', label: 'IA', type: 'page' },
      { id: '2', label: 'ML', type: 'entity', entityType: 'CONCEPT' },
      { id: '3', label: 'Deep Learning', type: 'entity', entityType: 'CONCEPT' },
      { id: '4', label: 'NLP', type: 'entity', entityType: 'CONCEPT' },
    ],
    links: [
      { source: '1', target: '2' },
      { source: '1', target: '3' },
      { source: '2', target: '3' },
      { source: '1', target: '4' },
    ],
  });

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
          {pagesRecentes.map((page) => (
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
          ))}
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
