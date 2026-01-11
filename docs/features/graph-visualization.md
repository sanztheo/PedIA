# PedIA - Graph Visualization (Obsidian-style)

## Overview

PedIA affiche les connexions entre pages comme Obsidian: un graphe interactif de noeuds et liens.

---

## Library Comparison

### Performance Matrix (1000+ Nodes)

| Library | Rendering | Performance | Best For |
|---------|-----------|-------------|----------|
| **Sigma.js** | WebGL | Excellent (5000+) | Large graphs |
| **react-force-graph** | Canvas/WebGL | Excellent | 2D/3D flexibility |
| **D3.js** | SVG/Canvas | Good | Custom control |
| **Cytoscape.js** | Canvas | Excellent | Analysis features |
| **vis.js** | Canvas | Good | Ease of use |

### Recommendation

**Phase 1**: react-force-graph (2D)
- Simple API, bonne performance
- Facile a integrer avec React

**Phase 2**: Sigma.js
- WebGL pour graphs > 2000 nodes
- Meilleure performance zoom/pan

---

## Data Structure

### Graph Schema

```typescript
// types/graph.ts

interface GraphNode {
  id: string;
  label: string;
  slug: string;
  type: 'page' | 'entity';
  category?: EntityType;
  size?: number;      // Visual size
  color?: string;
  x?: number;         // Cached position
  y?: number;
  metadata?: {
    description?: string;
    viewCount?: number;
    createdAt?: Date;
  };
}

interface GraphLink {
  source: string;     // Node ID
  target: string;     // Node ID
  type?: string;      // Relation type
  strength?: number;  // Force strength (0-1)
  label?: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// For efficient lookups
interface GraphIndex {
  nodeMap: Map<string, GraphNode>;
  linkMap: Map<string, GraphLink>;
  adjacencyList: Map<string, Set<string>>;
}
```

### Building Graph Index

```typescript
// utils/graph.ts

export function buildGraphIndex(data: GraphData): GraphIndex {
  const nodeMap = new Map(data.nodes.map(n => [n.id, n]));
  const linkMap = new Map(
    data.links.map(l => [`${l.source}-${l.target}`, l])
  );

  const adjacencyList = new Map<string, Set<string>>();
  data.nodes.forEach(n => adjacencyList.set(n.id, new Set()));

  data.links.forEach(link => {
    adjacencyList.get(link.source)?.add(link.target);
    adjacencyList.get(link.target)?.add(link.source); // Bidirectional
  });

  return { nodeMap, linkMap, adjacencyList };
}

export function getNeighbors(
  nodeId: string,
  index: GraphIndex,
  depth: number = 1
): Set<string> {
  const visited = new Set<string>();
  const queue: Array<{ id: string; d: number }> = [{ id: nodeId, d: 0 }];

  while (queue.length > 0) {
    const { id, d } = queue.shift()!;
    if (visited.has(id) || d > depth) continue;

    visited.add(id);
    const neighbors = index.adjacencyList.get(id) || new Set();
    neighbors.forEach(n => {
      if (!visited.has(n)) {
        queue.push({ id: n, d: d + 1 });
      }
    });
  }

  return visited;
}
```

---

## Main Graph Component

### Full Graph View

```tsx
// components/graph/GraphView.tsx
import { useRef, useCallback, useState, useEffect } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { useRouter } from 'next/navigation';
import { useGraph } from '@/hooks/useGraph';
import { GraphControls } from './GraphControls';
import { GraphMinimap } from './GraphMinimap';
import { GraphTooltip } from './GraphTooltip';

interface GraphViewProps {
  initialPageId?: string;
  onNodeSelect?: (nodeId: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  PERSON: '#ef4444',
  ORGANIZATION: '#3b82f6',
  LOCATION: '#22c55e',
  CONCEPT: '#a855f7',
  EVENT: '#f59e0b',
  PRODUCT: '#06b6d4',
  page: '#6b7280',
};

export function GraphView({ initialPageId, onNodeSelect }: GraphViewProps) {
  const router = useRouter();
  const graphRef = useRef<ForceGraphMethods>();
  const containerRef = useRef<HTMLDivElement>(null);

  const { nodes, links, loading } = useGraph();
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(initialPageId || null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Handle resize
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Center on initial node
  useEffect(() => {
    if (initialPageId && graphRef.current) {
      const node = nodes.find(n => n.id === initialPageId);
      if (node) {
        graphRef.current.centerAt(node.x, node.y, 500);
        graphRef.current.zoom(2, 500);
      }
    }
  }, [initialPageId, nodes]);

  // Build graph data with sizes based on connections
  const graphData = useMemo(() => ({
    nodes: nodes.map(node => ({
      ...node,
      val: 1 + links.filter(l =>
        l.source === node.id || l.target === node.id
      ).length * 0.3,
      color: node.type === 'page'
        ? CATEGORY_COLORS.page
        : CATEGORY_COLORS[node.category || 'CONCEPT'],
    })),
    links: links.map(link => ({
      ...link,
      color: selectedNode &&
        (link.source === selectedNode || link.target === selectedNode)
          ? '#3b82f6'
          : '#e5e7eb',
    })),
  }), [nodes, links, selectedNode]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node.id);
    onNodeSelect?.(node.id);

    if (node.type === 'page') {
      router.push(`/page/${node.slug}`);
    }
  }, [router, onNodeSelect]);

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node);
    if (containerRef.current) {
      containerRef.current.style.cursor = node ? 'pointer' : 'default';
    }
  }, []);

  const handleZoomIn = () => graphRef.current?.zoom(graphRef.current.zoom() * 1.5, 300);
  const handleZoomOut = () => graphRef.current?.zoom(graphRef.current.zoom() / 1.5, 300);
  const handleCenter = () => graphRef.current?.centerAt(0, 0, 500);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        // Node rendering
        nodeLabel=""
        nodeColor={node => node.color}
        nodeVal={node => node.val}
        nodeCanvasObject={(node, ctx, globalScale) => {
          // Draw node
          const size = node.val * 4;
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI);
          ctx.fillStyle = node.color;
          ctx.fill();

          // Draw label if zoomed enough
          if (globalScale > 0.8) {
            const label = node.label;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#374151';
            ctx.fillText(label, node.x!, node.y! + size + 2);
          }

          // Highlight selected
          if (node.id === selectedNode) {
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
          }
        }}
        // Link rendering
        linkColor={link => link.color}
        linkWidth={link =>
          selectedNode &&
          (link.source.id === selectedNode || link.target.id === selectedNode)
            ? 2
            : 1
        }
        linkDirectionalArrowLength={0}
        // Interactions
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        enableNodeDrag={true}
        onNodeDragEnd={(node) => {
          // Fix position after drag
          node.fx = node.x;
          node.fy = node.y;
        }}
        // Physics
        cooldownTime={3000}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        d3Force={{
          link: { distance: 100 },
          charge: { strength: -300 },
          center: { x: 0, y: 0 },
        }}
      />

      {/* Controls */}
      <GraphControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onCenter={handleCenter}
      />

      {/* Minimap */}
      <GraphMinimap
        graphData={graphData}
        viewport={{ x: 0, y: 0, scale: 1 }}
        onNavigate={(x, y) => graphRef.current?.centerAt(x, y, 300)}
      />

      {/* Tooltip */}
      {hoveredNode && (
        <GraphTooltip node={hoveredNode} />
      )}
    </div>
  );
}
```

### Minimap Component

```tsx
// components/graph/GraphMinimap.tsx
import { useRef, useEffect } from 'react';

interface MinimapProps {
  graphData: GraphData;
  viewport: { x: number; y: number; scale: number };
  onNavigate: (x: number, y: number) => void;
}

export function GraphMinimap({ graphData, viewport, onNavigate }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate bounds
    const nodes = graphData.nodes.filter(n => n.x !== undefined);
    if (nodes.length === 0) return;

    const minX = Math.min(...nodes.map(n => n.x!));
    const maxX = Math.max(...nodes.map(n => n.x!));
    const minY = Math.min(...nodes.map(n => n.y!));
    const maxY = Math.max(...nodes.map(n => n.y!));

    const scaleX = canvas.width / (maxX - minX + 100);
    const scaleY = canvas.height / (maxY - minY + 100);
    const scale = Math.min(scaleX, scaleY);

    // Draw links
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    graphData.links.forEach(link => {
      const source = nodes.find(n => n.id === (link.source.id || link.source));
      const target = nodes.find(n => n.id === (link.target.id || link.target));
      if (!source || !target) return;

      ctx.beginPath();
      ctx.moveTo(
        (source.x! - minX + 50) * scale,
        (source.y! - minY + 50) * scale
      );
      ctx.lineTo(
        (target.x! - minX + 50) * scale,
        (target.y! - minY + 50) * scale
      );
      ctx.stroke();
    });

    // Draw nodes
    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(
        (node.x! - minX + 50) * scale,
        (node.y! - minY + 50) * scale,
        2,
        0,
        2 * Math.PI
      );
      ctx.fillStyle = node.color || '#6b7280';
      ctx.fill();
    });

    // Draw viewport rectangle
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      (viewport.x - minX + 50) * scale - 30 / viewport.scale,
      (viewport.y - minY + 50) * scale - 20 / viewport.scale,
      60 / viewport.scale,
      40 / viewport.scale
    );
  }, [graphData, viewport]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to graph coordinates
    const nodes = graphData.nodes.filter(n => n.x !== undefined);
    const minX = Math.min(...nodes.map(n => n.x!));
    const maxX = Math.max(...nodes.map(n => n.x!));
    const minY = Math.min(...nodes.map(n => n.y!));
    const maxY = Math.max(...nodes.map(n => n.y!));

    const scaleX = canvas.width / (maxX - minX + 100);
    const scaleY = canvas.height / (maxY - minY + 100);
    const scale = Math.min(scaleX, scaleY);

    const graphX = x / scale + minX - 50;
    const graphY = y / scale + minY - 50;

    onNavigate(graphX, graphY);
  };

  return (
    <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-2">
      <canvas
        ref={canvasRef}
        width={150}
        height={100}
        className="cursor-pointer"
        onClick={handleClick}
      />
    </div>
  );
}
```

### Graph Controls

```tsx
// components/graph/GraphControls.tsx
import { ZoomIn, ZoomOut, Maximize2, Filter } from 'lucide-react';

interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenter: () => void;
  onFilter?: (filter: string) => void;
}

export function GraphControls({
  onZoomIn,
  onZoomOut,
  onCenter,
  onFilter,
}: GraphControlsProps) {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2">
      <button
        onClick={onZoomIn}
        className="p-2 bg-white rounded-lg shadow hover:bg-gray-50"
        title="Zoom in"
      >
        <ZoomIn className="w-5 h-5" />
      </button>
      <button
        onClick={onZoomOut}
        className="p-2 bg-white rounded-lg shadow hover:bg-gray-50"
        title="Zoom out"
      >
        <ZoomOut className="w-5 h-5" />
      </button>
      <button
        onClick={onCenter}
        className="p-2 bg-white rounded-lg shadow hover:bg-gray-50"
        title="Center view"
      >
        <Maximize2 className="w-5 h-5" />
      </button>
      {onFilter && (
        <button
          onClick={() => onFilter('')}
          className="p-2 bg-white rounded-lg shadow hover:bg-gray-50"
          title="Filter"
        >
          <Filter className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
```

---

## Sidebar Mini-Graph

```tsx
// components/layout/SidebarGraph.tsx
import { useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useLocalGraph } from '@/hooks/useGraph';

interface SidebarGraphProps {
  currentPageId?: string;
  onNodeClick: (slug: string) => void;
}

export function SidebarGraph({ currentPageId, onNodeClick }: SidebarGraphProps) {
  const { nodes, links, loading } = useLocalGraph(currentPageId, 1);

  const graphData = useMemo(() => {
    if (!nodes.length) return { nodes: [], links: [] };

    return {
      nodes: nodes.map(n => ({
        ...n,
        color: n.id === currentPageId ? '#3b82f6' : '#9ca3af',
        val: n.id === currentPageId ? 2 : 1,
      })),
      links,
    };
  }, [nodes, links, currentPageId]);

  if (loading || !nodes.length) {
    return (
      <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
        <span className="text-gray-400 text-sm">
          {loading ? 'Loading...' : 'No connections'}
        </span>
      </div>
    );
  }

  return (
    <div className="h-48 border rounded-lg overflow-hidden">
      <ForceGraph2D
        graphData={graphData}
        width={220}
        height={180}
        nodeLabel="label"
        nodeColor={n => n.color}
        nodeVal={n => n.val}
        linkColor={() => '#e5e7eb'}
        onNodeClick={(node) => {
          if (node.slug) onNodeClick(node.slug);
        }}
        cooldownTime={1000}
        enableNodeDrag={false}
        enableZoom={false}
        enablePan={false}
      />
    </div>
  );
}
```

---

## useGraph Hook

```typescript
// hooks/useGraph.ts
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface UseGraphOptions {
  pageId?: string;
  depth?: number;
}

export function useGraph(options?: UseGraphOptions) {
  const endpoint = options?.pageId
    ? `/api/graph/local/${options.pageId}?depth=${options.depth || 2}`
    : '/api/graph';

  const { data, error, isLoading, mutate } = useSWR<GraphData>(
    endpoint,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    nodes: data?.nodes || [],
    links: data?.links || [],
    loading: isLoading,
    error,
    refresh: mutate,
  };
}

export function useLocalGraph(pageId?: string, depth: number = 1) {
  return useGraph(pageId ? { pageId, depth } : undefined);
}

export function useFullGraph() {
  return useGraph();
}
```

---

## Performance Optimizations

### 1. Level of Detail (LOD)

```typescript
// Adjust rendering based on zoom level
function getLODConfig(zoomLevel: number) {
  if (zoomLevel < 0.5) {
    return {
      showLabels: false,
      nodeDetail: 'simple',
      maxNodes: 500,
    };
  } else if (zoomLevel < 1.5) {
    return {
      showLabels: true,
      nodeDetail: 'medium',
      maxNodes: 1000,
    };
  } else {
    return {
      showLabels: true,
      nodeDetail: 'full',
      maxNodes: 2000,
    };
  }
}
```

### 2. Web Worker for Physics

```typescript
// workers/forceSimulation.worker.ts
import * as d3 from 'd3-force';

self.onmessage = (e) => {
  const { nodes, links, iterations } = e.data;

  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(0, 0))
    .stop();

  // Run simulation
  for (let i = 0; i < iterations; i++) {
    simulation.tick();
  }

  self.postMessage({
    nodes: nodes.map(n => ({ id: n.id, x: n.x, y: n.y })),
  });
};
```

### 3. Viewport Culling

```typescript
// Only render nodes in viewport
function getVisibleNodes(
  nodes: GraphNode[],
  viewport: { x: number; y: number; width: number; height: number }
) {
  const margin = 100; // Extra margin for smooth scrolling

  return nodes.filter(node => {
    if (node.x === undefined || node.y === undefined) return true;

    return (
      node.x >= viewport.x - margin &&
      node.x <= viewport.x + viewport.width + margin &&
      node.y >= viewport.y - margin &&
      node.y <= viewport.y + viewport.height + margin
    );
  });
}
```

### 4. Incremental Updates

```typescript
// Only update changed nodes
function useIncrementalGraph() {
  const { nodes, links } = useGraph();
  const prevNodesRef = useRef<GraphNode[]>([]);

  const incrementalData = useMemo(() => {
    const prevNodes = prevNodesRef.current;
    const newNodes = nodes.filter(
      n => !prevNodes.find(p => p.id === n.id)
    );
    const removedNodes = prevNodes.filter(
      p => !nodes.find(n => n.id === p.id)
    );

    prevNodesRef.current = nodes;

    return { nodes, links, newNodes, removedNodes };
  }, [nodes, links]);

  return incrementalData;
}
```

---

## 3D Graph (Phase 2)

```tsx
// components/graph/GraphView3D.tsx
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';

export function GraphView3D({ nodes, links, onNodeClick }) {
  return (
    <ForceGraph3D
      graphData={{ nodes, links }}
      nodeThreeObject={(node) => {
        // Custom 3D node
        const geometry = new THREE.SphereGeometry(node.val * 2);
        const material = new THREE.MeshLambertMaterial({
          color: node.color,
          transparent: true,
          opacity: 0.9,
        });
        return new THREE.Mesh(geometry, material);
      }}
      linkThreeObject={(link) => {
        // Custom 3D link
        const material = new THREE.LineBasicMaterial({
          color: '#cccccc',
          opacity: 0.5,
          transparent: true,
        });
        return new THREE.Line(new THREE.BufferGeometry(), material);
      }}
      onNodeClick={onNodeClick}
      enableNavigationControls={true}
      backgroundColor="#ffffff"
    />
  );
}
```

---

## Voir Aussi

- [Frontend Architecture](../architecture/frontend.md)
- [Database Design](../architecture/database.md)
- [Entity Extraction](./entity-extraction.md)
