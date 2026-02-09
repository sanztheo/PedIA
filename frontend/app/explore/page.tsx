"use client";

import { useRef, useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, ArrowLeft, LayoutGrid, List } from "lucide-react";
import { useGraph } from "@/hooks/useGraph";
import { GraphView, type GraphViewRef } from "@/components/graph/GraphView";
import { GraphControls } from "@/components/graph/GraphControls";
import { PageListView } from "@/components/graph/PageListView";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { EntityType, GraphNode } from "@/types";

const ALL_ENTITY_TYPES: EntityType[] = [
  "PERSON",
  "ORGANIZATION",
  "LOCATION",
  "EVENT",
  "CONCEPT",
  "WORK",
  "OTHER",
];

type ViewMode = "graph" | "list";

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pageId = searchParams.get("page");

  const graphRef = useRef<GraphViewRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [filters, setFilters] = useState<EntityType[]>(ALL_ENTITY_TYPES);
  const [viewMode, setViewMode] = useState<ViewMode>("graph");

  const { data, loading, error } = useGraph({
    pageId: pageId || undefined,
    limit: 200,
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (pageId && data && graphRef.current && viewMode === "graph") {
      graphRef.current.centerOn(pageId);
    }
  }, [pageId, data, viewMode]);

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (node.type === "page" && node.slug) {
        router.push(`/wiki/${node.slug}`);
      }
    },
    [router]
  );

  const handleZoomIn = useCallback(() => {
    graphRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    graphRef.current?.zoomOut();
  }, []);

  const handleReset = useCallback(() => {
    graphRef.current?.reset();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="flex-shrink-0 border-b border-border">
        <div className="h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:opacity-70 transition-opacity">
              <Image
                src="/logo/logo_no_bg.svg"
                alt="PedIA"
                width={28}
                height={28}
                className="invert dark:invert-0"
              />
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-sm font-medium">
              {pageId ? "Graph local" : "Explorateur"}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <ToggleGroup 
              type="single" 
              value={viewMode} 
              onValueChange={(v) => v && setViewMode(v as ViewMode)}
              className="bg-muted/50 p-0.5 rounded-lg"
            >
              <ToggleGroupItem 
                value="graph" 
                aria-label="Vue graphe"
                className="px-2.5 py-1.5 data-[state=on]:bg-background data-[state=on]:shadow-sm"
              >
                <LayoutGrid className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="list" 
                aria-label="Vue liste"
                className="px-2.5 py-1.5 data-[state=on]:bg-background data-[state=on]:shadow-sm"
              >
                <List className="size-4" />
              </ToggleGroupItem>
            </ToggleGroup>

            {pageId && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/explore">
                  <ArrowLeft className="size-4 mr-1" />
                  Tout
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href="/">Rechercher</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden">
        <div ref={containerRef} className="absolute inset-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="size-6 text-muted-foreground animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            </div>
          ) : data ? (
            viewMode === "graph" ? (
              <GraphView
                ref={graphRef}
                data={data}
                width={dimensions.width}
                height={dimensions.height}
                filters={filters}
                highlightedId={pageId || undefined}
                onNodeClick={handleNodeClick}
              />
            ) : (
              <PageListView 
                data={data} 
                highlightedId={pageId || undefined}
              />
            )
          ) : null}
        </div>

        {!loading && !error && data && viewMode === "graph" && (
          <div className="absolute top-4 right-4">
            <GraphControls
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onReset={handleReset}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
        )}

        {!loading && data && (
          <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-background/80 backdrop-blur-sm border border-border rounded-lg text-xs text-muted-foreground">
            {data.nodes.filter(n => n.type === 'page').length} pages · {data.links.length} liens
          </div>
        )}
      </main>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-background">
          <Loader2 className="size-6 text-muted-foreground animate-spin" />
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
