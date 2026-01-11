# PedIA - Frontend Architecture

## Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **State**: React Context + SWR
- **Streaming**: Vercel AI SDK (@ai-sdk/react)
- **Graph**: react-force-graph / Sigma.js

---

## Structure des Fichiers

```
frontend/
+-- src/
|   +-- app/
|   |   +-- page.tsx                 # Homepage (search only)
|   |   +-- layout.tsx               # Root layout + sidebar
|   |   +-- page/
|   |   |   +-- [slug]/
|   |   |       +-- page.tsx         # Page encyclopedie (SSR)
|   |   +-- search/
|   |   |   +-- page.tsx             # Search results + progress
|   |   +-- explore/
|   |       +-- page.tsx             # Graph visualization
|   +-- components/
|   |   +-- search/
|   |   |   +-- SearchBar.tsx
|   |   |   +-- SearchProgress.tsx   # Steps AI en temps reel
|   |   |   +-- SearchResults.tsx
|   |   +-- page/
|   |   |   +-- PageContent.tsx      # Markdown renderer
|   |   |   +-- PageLinks.tsx        # Liens vers autres pages
|   |   |   +-- PageMetadata.tsx
|   |   +-- graph/
|   |   |   +-- GraphView.tsx        # Main graph component
|   |   |   +-- GraphMinimap.tsx     # Sidebar mini-graph
|   |   |   +-- GraphControls.tsx
|   |   +-- layout/
|   |       +-- Sidebar.tsx
|   |       +-- Header.tsx
|   +-- hooks/
|   |   +-- useSearch.ts             # Search + generation hook
|   |   +-- useGraph.ts              # Graph data hook
|   |   +-- usePage.ts               # Page data hook
|   +-- services/
|   |   +-- api.ts                   # API client
|   +-- types/
|       +-- page.ts
|       +-- graph.ts
|       +-- search.ts
+-- public/
+-- next.config.js
+-- tailwind.config.js
```

---

## Pages Principales

### 1. Homepage (`/`)

Design minimaliste avec recherche centree.

```tsx
// app/page.tsx
export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-2xl px-4">
        <h1 className="text-4xl font-bold text-center mb-8">PedIA</h1>
        <p className="text-center text-gray-600 mb-8">
          L'encyclopedie auto-evolutive
        </p>
        <SearchBar />
      </div>
    </main>
  );
}
```

### 2. Page Encyclopedie (`/page/[slug]`)

SSR pour SEO optimal.

```tsx
// app/page/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const page = await getPage(params.slug);
  return {
    title: `${page.title} - PedIA`,
    description: page.summary,
  };
}

export default async function PageView({ params }) {
  const page = await getPage(params.slug);
  const relatedPages = await getRelatedPages(page.id);

  return (
    <div className="flex">
      <article className="flex-1 prose max-w-none">
        <PageContent content={page.content} />
      </article>
      <aside className="w-64 ml-8">
        <PageLinks links={relatedPages} />
      </aside>
    </div>
  );
}
```

### 3. Search Progress (`/search`)

Vue temps reel de la generation.

```tsx
// app/search/page.tsx
'use client';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const { steps, result, status } = useSearch(query);

  return (
    <div className="max-w-4xl mx-auto">
      <SearchProgress steps={steps} />
      {status === 'complete' && <SearchResults result={result} />}
    </div>
  );
}
```

### 4. Graph Explorer (`/explore`)

Visualisation Obsidian-style.

```tsx
// app/explore/page.tsx
'use client';

export default function ExplorePage() {
  const { nodes, links, loading } = useGraph();

  return (
    <div className="h-screen">
      <GraphView
        nodes={nodes}
        links={links}
        onNodeClick={(node) => router.push(`/page/${node.slug}`)}
      />
    </div>
  );
}
```

---

## Composants Cles

### SearchProgress

Affiche les etapes de generation en temps reel.

```tsx
// components/search/SearchProgress.tsx
interface Step {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'complete' | 'error';
  details?: string;
}

export function SearchProgress({ steps }: { steps: Step[] }) {
  return (
    <div className="space-y-4">
      {steps.map((step) => (
        <div key={step.id} className="flex items-center gap-3">
          <StepIcon status={step.status} />
          <div>
            <p className="font-medium">{step.label}</p>
            {step.details && (
              <p className="text-sm text-gray-500">{step.details}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StepIcon({ status }: { status: Step['status'] }) {
  switch (status) {
    case 'pending':
      return <Circle className="text-gray-300" />;
    case 'in_progress':
      return <Spinner className="text-blue-500 animate-spin" />;
    case 'complete':
      return <CheckCircle className="text-green-500" />;
    case 'error':
      return <XCircle className="text-red-500" />;
  }
}
```

### GraphView

Visualisation des liens entre pages.

```tsx
// components/graph/GraphView.tsx
import ForceGraph2D from 'react-force-graph-2d';

interface GraphNode {
  id: string;
  label: string;
  slug: string;
  category?: string;
}

interface GraphLink {
  source: string;
  target: string;
}

export function GraphView({
  nodes,
  links,
  onNodeClick
}: {
  nodes: GraphNode[];
  links: GraphLink[];
  onNodeClick: (node: GraphNode) => void;
}) {
  const graphRef = useRef();

  const graphData = useMemo(() => ({
    nodes: nodes.map(n => ({
      ...n,
      val: 1 + (links.filter(l =>
        l.source === n.id || l.target === n.id
      ).length * 0.5)
    })),
    links
  }), [nodes, links]);

  return (
    <ForceGraph2D
      ref={graphRef}
      graphData={graphData}
      nodeLabel="label"
      nodeColor={node => getCategoryColor(node.category)}
      linkColor={() => '#e5e7eb'}
      onNodeClick={onNodeClick}
      nodeCanvasObject={(node, ctx, globalScale) => {
        // Custom node rendering
        const label = node.label;
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#374151';
        ctx.fillText(label, node.x, node.y + 10);
      }}
      cooldownTime={3000}
      enableNodeDrag={true}
    />
  );
}
```

### Sidebar

Navigation avec mini-graph.

```tsx
// components/layout/Sidebar.tsx
export function Sidebar({ currentPageId }: { currentPageId?: string }) {
  const { recentPages } = useRecentPages();
  const { localGraph } = useLocalGraph(currentPageId);

  return (
    <aside className="w-64 border-r h-screen sticky top-0 p-4">
      {/* Logo + Search */}
      <div className="mb-6">
        <Link href="/" className="text-xl font-bold">PedIA</Link>
      </div>

      {/* Mini Graph */}
      {localGraph && (
        <div className="mb-6 h-48 border rounded">
          <GraphMinimap
            nodes={localGraph.nodes}
            links={localGraph.links}
            highlightId={currentPageId}
          />
        </div>
      )}

      {/* Recent Pages */}
      <nav>
        <h3 className="text-sm font-semibold mb-2">Pages recentes</h3>
        <ul className="space-y-1">
          {recentPages.map(page => (
            <li key={page.id}>
              <Link
                href={`/page/${page.slug}`}
                className="text-sm hover:underline"
              >
                {page.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* All Pages Button */}
      <Link
        href="/explore"
        className="mt-6 block text-center py-2 border rounded hover:bg-gray-50"
      >
        Voir toutes les pages
      </Link>
    </aside>
  );
}
```

---

## Hooks Principaux

### useSearch

Hook pour recherche + generation avec streaming.

```tsx
// hooks/useSearch.ts
import { useChat } from '@ai-sdk/react';

interface SearchStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'complete' | 'error';
  details?: string;
}

export function useSearch(query: string | null) {
  const [steps, setSteps] = useState<SearchStep[]>([
    { id: 'search', label: 'Recherche web', status: 'pending' },
    { id: 'analyze', label: 'Analyse des sources', status: 'pending' },
    { id: 'generate', label: 'Generation du contenu', status: 'pending' },
    { id: 'extract', label: 'Extraction des entites', status: 'pending' },
    { id: 'link', label: 'Creation des liens', status: 'pending' },
  ]);

  const { messages, status, append } = useChat({
    api: `${process.env.NEXT_PUBLIC_API_URL}/api/generate`,
    onResponse: (response) => {
      // Parse SSE for step updates
    },
  });

  useEffect(() => {
    if (query) {
      append({ role: 'user', content: query });
    }
  }, [query]);

  return {
    steps,
    result: messages.find(m => m.role === 'assistant'),
    status,
  };
}
```

### useGraph

Hook pour donnees du graph.

```tsx
// hooks/useGraph.ts
import useSWR from 'swr';

export function useGraph(options?: { pageId?: string; depth?: number }) {
  const { data, error, isLoading } = useSWR(
    options?.pageId
      ? `/api/graph?pageId=${options.pageId}&depth=${options.depth || 2}`
      : '/api/graph',
    fetcher
  );

  return {
    nodes: data?.nodes || [],
    links: data?.links || [],
    loading: isLoading,
    error,
  };
}

export function useLocalGraph(pageId?: string) {
  return useGraph({ pageId, depth: 1 });
}
```

---

## Streaming UI Pattern

### SSE Event Types

```typescript
type SSEEvent =
  | { type: 'step_start'; step: string; details?: string }
  | { type: 'step_complete'; step: string }
  | { type: 'step_error'; step: string; error: string }
  | { type: 'content_chunk'; content: string }
  | { type: 'entity_found'; entity: { name: string; type: string } }
  | { type: 'complete'; pageId: string; slug: string };
```

### Event Handling

```tsx
// Handling SSE events in useSearch
const eventSource = new EventSource(`${API_URL}/api/generate?q=${query}`);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'step_start':
      setSteps(prev => prev.map(s =>
        s.id === data.step
          ? { ...s, status: 'in_progress', details: data.details }
          : s
      ));
      break;

    case 'step_complete':
      setSteps(prev => prev.map(s =>
        s.id === data.step
          ? { ...s, status: 'complete' }
          : s
      ));
      break;

    case 'content_chunk':
      setContent(prev => prev + data.content);
      break;

    case 'complete':
      router.push(`/page/${data.slug}`);
      break;
  }
};
```

---

## Performance Optimizations

### 1. Server Components par defaut

```tsx
// Pages SSR pour SEO
// app/page/[slug]/page.tsx - Server Component (default)
export default async function PageView({ params }) {
  const page = await getPage(params.slug); // Server-side fetch
  return <PageContent content={page.content} />;
}
```

### 2. SWR pour cache client

```tsx
// Cache + revalidation automatique
const { data } = useSWR('/api/pages/recent', fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 60000, // 1 minute
});
```

### 3. Graph virtualization

```tsx
// Pour grands graphs (>1000 nodes)
<ForceGraph2D
  graphData={graphData}
  nodeVisibility={node =>
    // Only render visible nodes
    isInViewport(node, viewport)
  }
/>
```

### 4. Markdown lazy parsing

```tsx
// Parse markdown seulement quand visible
const ParsedContent = dynamic(() => import('./ParsedContent'), {
  loading: () => <MarkdownSkeleton />,
});
```

---

## Voir Aussi

- [Architecture Overview](./overview.md)
- [Backend Architecture](./backend.md)
- [Streaming UI](../features/streaming-ui.md)
- [Graph Visualization](../features/graph-visualization.md)
