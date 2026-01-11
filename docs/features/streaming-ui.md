# PedIA - Streaming UI & Progress Visualization

## Overview

L'experience utilisateur de PedIA repose sur la transparence: l'utilisateur voit chaque etape de la generation en temps reel.

---

## Architecture Streaming

### Protocol: Server-Sent Events (SSE)

**Pourquoi SSE plutot que WebSocket ?**
- Communication unidirectionnelle (serveur → client)
- Reconnexion automatique native
- Compatible HTTP standard (pas de firewall issues)
- Plus simple a implementer

### Flow de Streaming

```
+-------------------+                    +-------------------+
|     Frontend      |                    |     Backend       |
+-------------------+                    +-------------------+
        |                                        |
        |  GET /api/generate?q=Tesla             |
        |--------------------------------------->|
        |                                        |
        |  SSE: step_start (search)              |
        |<---------------------------------------|
        |                                        |
        |  SSE: step_complete (search)           |
        |<---------------------------------------|
        |                                        |
        |  SSE: step_start (analyze)             |
        |<---------------------------------------|
        |                                        |
        |  SSE: step_complete (analyze)          |
        |<---------------------------------------|
        |                                        |
        |  SSE: step_start (generate)            |
        |<---------------------------------------|
        |                                        |
        |  SSE: content_chunk ("# Tesla...")     |
        |<---------------------------------------|
        |  SSE: content_chunk ("Tesla, Inc...")  |
        |<---------------------------------------|
        |  ... (streaming content)               |
        |                                        |
        |  SSE: step_complete (generate)         |
        |<---------------------------------------|
        |                                        |
        |  SSE: entity_found (Elon Musk)         |
        |<---------------------------------------|
        |  SSE: entity_found (SpaceX)            |
        |<---------------------------------------|
        |                                        |
        |  SSE: complete (pageId, slug)          |
        |<---------------------------------------|
        |                                        |
```

---

## Event Types

### SSE Event Schema

```typescript
// types/sse.ts

type SSEEvent =
  | StepStartEvent
  | StepCompleteEvent
  | StepErrorEvent
  | ContentChunkEvent
  | EntityFoundEvent
  | SourceAddedEvent
  | CompleteEvent
  | ExistingPageEvent;

interface StepStartEvent {
  type: 'step_start';
  step: StepId;
  details?: string;
  progress?: number; // 0-100
}

interface StepCompleteEvent {
  type: 'step_complete';
  step: StepId;
  duration?: number; // ms
}

interface StepErrorEvent {
  type: 'step_error';
  step: StepId;
  error: string;
  recoverable: boolean;
}

interface ContentChunkEvent {
  type: 'content_chunk';
  content: string;
  section?: string;
}

interface EntityFoundEvent {
  type: 'entity_found';
  entity: {
    name: string;
    type: EntityType;
    isNew: boolean;
    slug?: string;
  };
}

interface SourceAddedEvent {
  type: 'source_added';
  source: {
    title: string;
    url: string;
    confidence: number;
  };
}

interface CompleteEvent {
  type: 'complete';
  pageId: string;
  slug: string;
  title: string;
}

interface ExistingPageEvent {
  type: 'existing';
  pageId: string;
  slug: string;
}

type StepId =
  | 'search'
  | 'analyze'
  | 'verify'
  | 'generate'
  | 'extract'
  | 'link'
  | 'save';
```

---

## Backend Implementation

### SSE Endpoint (Hono)

```typescript
// routes/generate.ts
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';

const app = new Hono();

app.get('/generate', async (c) => {
  const query = c.req.query('q');

  if (!query) {
    return c.json({ error: 'Query required' }, 400);
  }

  return streamSSE(c, async (stream) => {
    const emitter = createSSEEmitter(stream);

    try {
      // Check existing page
      const existing = await pageService.findByQuery(query);
      if (existing) {
        await emitter.existing(existing);
        return;
      }

      // Step 1: Search
      await emitter.stepStart('search', 'Recherche sur le web...');
      const searchResults = await webSearchService.search(query);
      await emitter.stepComplete('search');

      // Step 2: Analyze
      await emitter.stepStart('analyze', `Analyse de ${searchResults.length} sources...`);
      const analyzedSources = await analyzeService.analyze(searchResults);
      for (const source of analyzedSources) {
        await emitter.sourceAdded(source);
      }
      await emitter.stepComplete('analyze');

      // Step 3: Verify
      await emitter.stepStart('verify', 'Verification de la fiabilite...');
      const verifiedSources = await verifyService.verify(analyzedSources);
      await emitter.stepComplete('verify');

      // Step 4: Generate with streaming
      await emitter.stepStart('generate', 'Generation du contenu...');
      let fullContent = '';

      await generateWithStreaming(query, verifiedSources, {
        onChunk: async (chunk) => {
          fullContent += chunk;
          await emitter.contentChunk(chunk);
        },
      });
      await emitter.stepComplete('generate');

      // Step 5: Extract entities
      await emitter.stepStart('extract', 'Extraction des entites...');
      const entities = await entityService.extract(fullContent);
      for (const entity of entities) {
        await emitter.entityFound(entity);
      }
      await emitter.stepComplete('extract');

      // Step 6: Link entities
      await emitter.stepStart('link', 'Creation des liens...');
      await graphService.createLinks(entities);
      await emitter.stepComplete('link');

      // Step 7: Save
      await emitter.stepStart('save', 'Sauvegarde...');
      const page = await pageService.create({
        title: extractTitle(fullContent),
        slug: generateSlug(query),
        content: fullContent,
        entities,
        sources: verifiedSources,
      });
      await emitter.stepComplete('save');

      // Complete
      await emitter.complete(page);

    } catch (error) {
      await emitter.stepError(
        'generate',
        error instanceof Error ? error.message : 'Unknown error',
        false
      );
    }
  });
});

// SSE Emitter helper
function createSSEEmitter(stream: SSEStreamingApi) {
  const emit = async (event: string, data: any) => {
    await stream.writeSSE({
      event,
      data: JSON.stringify(data),
    });
  };

  return {
    stepStart: (step: StepId, details?: string) =>
      emit('step', { type: 'step_start', step, details }),

    stepComplete: (step: StepId) =>
      emit('step', { type: 'step_complete', step }),

    stepError: (step: StepId, error: string, recoverable: boolean) =>
      emit('step', { type: 'step_error', step, error, recoverable }),

    contentChunk: (content: string) =>
      emit('content', { type: 'content_chunk', content }),

    entityFound: (entity: Entity) =>
      emit('entity', { type: 'entity_found', entity }),

    sourceAdded: (source: Source) =>
      emit('source', { type: 'source_added', source }),

    existing: (page: Page) =>
      emit('existing', { type: 'existing', pageId: page.id, slug: page.slug }),

    complete: (page: Page) =>
      emit('complete', {
        type: 'complete',
        pageId: page.id,
        slug: page.slug,
        title: page.title,
      }),
  };
}
```

### Vercel AI SDK Streaming

```typescript
// services/ai/generate.ts
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

interface StreamCallbacks {
  onChunk: (chunk: string) => Promise<void>;
}

export async function generateWithStreaming(
  query: string,
  sources: VerifiedSource[],
  callbacks: StreamCallbacks
) {
  const result = await streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: buildGenerationPrompt(),
    messages: [
      {
        role: 'user',
        content: `
Query: ${query}

Sources:
${sources.map(s => `- [${s.title}](${s.url})\n${s.content}`).join('\n\n')}

Generate a comprehensive encyclopedia page in markdown.
        `,
      },
    ],
    maxTokens: 8192,
  });

  for await (const chunk of result.textStream) {
    await callbacks.onChunk(chunk);
  }

  return result;
}
```

---

## Frontend Implementation

### useSearch Hook

```typescript
// hooks/useSearch.ts
import { useState, useEffect, useCallback } from 'react';

interface Step {
  id: StepId;
  label: string;
  status: 'pending' | 'in_progress' | 'complete' | 'error';
  details?: string;
  duration?: number;
}

interface SearchState {
  steps: Step[];
  content: string;
  entities: EntityFound[];
  sources: SourceAdded[];
  result: { pageId: string; slug: string; title: string } | null;
  error: string | null;
  status: 'idle' | 'searching' | 'complete' | 'error' | 'existing';
}

const INITIAL_STEPS: Step[] = [
  { id: 'search', label: 'Recherche web', status: 'pending' },
  { id: 'analyze', label: 'Analyse des sources', status: 'pending' },
  { id: 'verify', label: 'Verification', status: 'pending' },
  { id: 'generate', label: 'Generation du contenu', status: 'pending' },
  { id: 'extract', label: 'Extraction des entites', status: 'pending' },
  { id: 'link', label: 'Creation des liens', status: 'pending' },
  { id: 'save', label: 'Sauvegarde', status: 'pending' },
];

export function useSearch(query: string | null) {
  const [state, setState] = useState<SearchState>({
    steps: INITIAL_STEPS,
    content: '',
    entities: [],
    sources: [],
    result: null,
    error: null,
    status: 'idle',
  });

  const startSearch = useCallback((searchQuery: string) => {
    // Reset state
    setState({
      steps: INITIAL_STEPS,
      content: '',
      entities: [],
      sources: [],
      result: null,
      error: null,
      status: 'searching',
    });

    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/api/generate?q=${encodeURIComponent(searchQuery)}`
    );

    const stepStartTimes: Record<string, number> = {};

    eventSource.addEventListener('step', (e) => {
      const data = JSON.parse(e.data);

      if (data.type === 'step_start') {
        stepStartTimes[data.step] = Date.now();
        setState(prev => ({
          ...prev,
          steps: prev.steps.map(s =>
            s.id === data.step
              ? { ...s, status: 'in_progress', details: data.details }
              : s
          ),
        }));
      }

      if (data.type === 'step_complete') {
        const duration = stepStartTimes[data.step]
          ? Date.now() - stepStartTimes[data.step]
          : undefined;

        setState(prev => ({
          ...prev,
          steps: prev.steps.map(s =>
            s.id === data.step
              ? { ...s, status: 'complete', duration }
              : s
          ),
        }));
      }

      if (data.type === 'step_error') {
        setState(prev => ({
          ...prev,
          steps: prev.steps.map(s =>
            s.id === data.step
              ? { ...s, status: 'error', details: data.error }
              : s
          ),
          error: data.error,
          status: 'error',
        }));
        eventSource.close();
      }
    });

    eventSource.addEventListener('content', (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'content_chunk') {
        setState(prev => ({
          ...prev,
          content: prev.content + data.content,
        }));
      }
    });

    eventSource.addEventListener('entity', (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'entity_found') {
        setState(prev => ({
          ...prev,
          entities: [...prev.entities, data.entity],
        }));
      }
    });

    eventSource.addEventListener('source', (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'source_added') {
        setState(prev => ({
          ...prev,
          sources: [...prev.sources, data.source],
        }));
      }
    });

    eventSource.addEventListener('existing', (e) => {
      const data = JSON.parse(e.data);
      setState(prev => ({
        ...prev,
        result: { pageId: data.pageId, slug: data.slug, title: '' },
        status: 'existing',
      }));
      eventSource.close();
    });

    eventSource.addEventListener('complete', (e) => {
      const data = JSON.parse(e.data);
      setState(prev => ({
        ...prev,
        result: {
          pageId: data.pageId,
          slug: data.slug,
          title: data.title,
        },
        status: 'complete',
      }));
      eventSource.close();
    });

    eventSource.onerror = () => {
      setState(prev => ({
        ...prev,
        error: 'Connection error',
        status: 'error',
      }));
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    if (query) {
      const cleanup = startSearch(query);
      return cleanup;
    }
  }, [query, startSearch]);

  return state;
}
```

### SearchProgress Component

```tsx
// components/search/SearchProgress.tsx
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Circle,
  Loader2,
  XCircle,
  Globe,
  FileSearch,
  Shield,
  Sparkles,
  Tags,
  Link,
  Save,
} from 'lucide-react';

const STEP_ICONS: Record<StepId, React.ComponentType> = {
  search: Globe,
  analyze: FileSearch,
  verify: Shield,
  generate: Sparkles,
  extract: Tags,
  link: Link,
  save: Save,
};

interface SearchProgressProps {
  steps: Step[];
  entities: EntityFound[];
  sources: SourceAdded[];
}

export function SearchProgress({ steps, entities, sources }: SearchProgressProps) {
  return (
    <div className="space-y-6">
      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const Icon = STEP_ICONS[step.id];
          const isActive = step.status === 'in_progress';
          const isComplete = step.status === 'complete';
          const isError = step.status === 'error';

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                flex items-center gap-4 p-4 rounded-lg
                ${isActive ? 'bg-blue-50 border border-blue-200' : ''}
                ${isComplete ? 'bg-green-50 border border-green-200' : ''}
                ${isError ? 'bg-red-50 border border-red-200' : ''}
                ${step.status === 'pending' ? 'bg-gray-50' : ''}
              `}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {step.status === 'pending' && (
                  <Circle className="w-6 h-6 text-gray-300" />
                )}
                {isActive && (
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                )}
                {isComplete && (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                )}
                {isError && (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
              </div>

              {/* Step Icon */}
              <Icon className={`
                w-5 h-5
                ${isActive ? 'text-blue-500' : ''}
                ${isComplete ? 'text-green-500' : ''}
                ${isError ? 'text-red-500' : ''}
                ${step.status === 'pending' ? 'text-gray-400' : ''}
              `} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-medium">{step.label}</p>
                {step.details && (
                  <p className="text-sm text-gray-500 truncate">
                    {step.details}
                  </p>
                )}
              </div>

              {/* Duration */}
              {step.duration && (
                <span className="text-xs text-gray-400">
                  {(step.duration / 1000).toFixed(1)}s
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Sources Found */}
      {sources.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold mb-2">Sources ({sources.length})</h3>
          <div className="space-y-2">
            <AnimatePresence>
              {sources.map((source, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-2 text-sm"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      source.confidence > 0.8
                        ? 'bg-green-500'
                        : source.confidence > 0.5
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                  />
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    {source.title}
                  </a>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Entities Found */}
      {entities.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold mb-2">Entites detectees ({entities.length})</h3>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {entities.map((entity, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`
                    px-2 py-1 text-xs rounded-full
                    ${entity.isNew ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}
                  `}
                >
                  {entity.name}
                  {entity.isNew && <span className="ml-1">(new)</span>}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Content Streaming Component

```tsx
// components/search/StreamingContent.tsx
import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';

interface StreamingContentProps {
  content: string;
  isStreaming: boolean;
}

export function StreamingContent({ content, isStreaming }: StreamingContentProps) {
  // Render partial markdown safely
  const safeContent = useMemo(() => {
    if (!isStreaming) return content;

    // Close any unclosed code blocks
    const codeBlockCount = (content.match(/```/g) || []).length;
    if (codeBlockCount % 2 !== 0) {
      return content + '\n```';
    }

    return content;
  }, [content, isStreaming]);

  return (
    <div className="prose max-w-none">
      <ReactMarkdown>{safeContent}</ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-2 h-5 bg-blue-500 animate-pulse ml-1" />
      )}
    </div>
  );
}
```

---

## Performance Optimizations

### 1. Batched State Updates

```typescript
// Batch rapid updates to prevent render thrashing
const batchedSetContent = useMemo(() => {
  let buffer = '';
  let timeout: NodeJS.Timeout | null = null;

  return (chunk: string) => {
    buffer += chunk;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      setState(prev => ({
        ...prev,
        content: prev.content + buffer,
      }));
      buffer = '';
    }, 50); // Flush every 50ms
  };
}, []);
```

### 2. Virtualized Content

```tsx
// For very long generated content
import { Virtuoso } from 'react-virtuoso';

function VirtualizedContent({ content }: { content: string }) {
  const paragraphs = content.split('\n\n');

  return (
    <Virtuoso
      data={paragraphs}
      itemContent={(index, paragraph) => (
        <ReactMarkdown key={index}>{paragraph}</ReactMarkdown>
      )}
    />
  );
}
```

### 3. Web Worker for Parsing

```typescript
// worker/markdown.worker.ts
self.onmessage = (e) => {
  const { content } = e.data;
  // Heavy markdown parsing
  const parsed = parseMarkdown(content);
  self.postMessage({ parsed });
};

// Usage in component
const worker = new Worker(new URL('./worker/markdown.worker.ts', import.meta.url));
worker.onmessage = (e) => setParsed(e.data.parsed);
worker.postMessage({ content });
```

---

## Error Handling

### Retry Logic

```typescript
// Automatic retry on connection error
function useSearchWithRetry(query: string | null, maxRetries = 3) {
  const [retryCount, setRetryCount] = useState(0);

  const { status, error, ...rest } = useSearch(query);

  useEffect(() => {
    if (status === 'error' && retryCount < maxRetries) {
      const timeout = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        // Trigger retry by changing query ref
      }, 2000 * (retryCount + 1)); // Exponential backoff

      return () => clearTimeout(timeout);
    }
  }, [status, retryCount, maxRetries]);

  return {
    ...rest,
    status,
    error,
    retryCount,
    maxRetries,
  };
}
```

### Graceful Degradation

```tsx
// Show partial results even on error
function SearchResults({ state }: { state: SearchState }) {
  if (state.status === 'error' && state.content.length > 0) {
    return (
      <div>
        <Alert variant="warning">
          Generation incomplete. Voici les resultats partiels:
        </Alert>
        <StreamingContent content={state.content} isStreaming={false} />
      </div>
    );
  }

  // Normal rendering...
}
```

---

## Voir Aussi

- [Frontend Architecture](../architecture/frontend.md)
- [Backend Architecture](../architecture/backend.md)
- [Graph Visualization](./graph-visualization.md)
