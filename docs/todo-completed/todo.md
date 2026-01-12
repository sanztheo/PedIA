# PedIA - TODO Implementation

## Vue d'ensemble

Ce document liste les taches restantes pour completer le MVP de PedIA.
Chaque tache suit le workflow EPCT (Explore, Plan, Code, Test).

---

## ✅ Tache 1: Page Explore (Graph Visualization) - COMPLETE

### Description

Creer la page `/explore` pour la visualisation du graph en plein ecran.

### Fichiers crees

```
frontend/app/explore/page.tsx           # ✅ Page principale
frontend/components/graph/GraphControls.tsx  # ✅ Controles zoom/pan/filtres
frontend/hooks/useGraph.ts              # ✅ Hook de fetching
```

### Acceptance Criteria

- [x] `/explore` affiche le graph complet
- [x] `/explore?page={pageId}` centre sur la page specifique
- [x] Controles zoom +/- et reset
- [x] Click sur un noeud navigue vers `/wiki/{slug}`
- [x] Filtres par type d'entite fonctionnels
- [x] Responsive (fonctionne sur mobile)

---

## ✅ Tache 2: GraphControls Component - COMPLETE

### Description

Composant de controles pour le GraphView (zoom, pan, filtres).

### Fichier

```
frontend/components/graph/GraphControls.tsx  # ✅ Cree
```

### Props

```typescript
interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  filters: EntityType[];
  onFiltersChange: (filters: EntityType[]) => void;
}
```

### UI Elements - ✅ Implementes

| Element | Action | Status |
|---------|--------|--------|
| Bouton + | Zoom in | ✅ |
| Bouton - | Zoom out | ✅ |
| Bouton Reset | Recentrer la vue | ✅ |
| Toggles par type | Filtrer les entites par type | ✅ |

---

## ✅ Tache 3: Amelioration GraphView - COMPLETE

### Description

Ajouter les fonctionnalites manquantes au GraphView existant.

### Fichier

```
frontend/components/graph/GraphView.tsx  # ✅ Modifie
```

### Ameliorations

| Feature | Status | Description |
|---------|--------|-------------|
| Zoom programmatique | ✅ | Expose `zoomIn()`, `zoomOut()`, `reset()` |
| Filtrage | ✅ | Prop `filters: EntityType[]` |
| Highlight node | ✅ | Prop `highlightedId?: string` |
| Responsive | ✅ | Auto-resize avec container |
| Cooldown simulation | ✅ | Arret auto quand stable |
| Pan canvas | ✅ | Drag pour deplacer la vue |

### API exposee (via forwardRef)

```typescript
interface GraphViewRef {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  centerOn: (nodeId: string) => void;
}
```

---

## ✅ Tache 4: Hook useGraph - COMPLETE

### Description

Hook custom pour gerer le fetching et le state du graph.

### Fichier

```
frontend/hooks/useGraph.ts  # ✅ Cree
```

### Interface

```typescript
interface UseGraphOptions {
  pageId?: string;      // Si defini, fetch local graph
  depth?: number;       // Pour local graph (default: 2)
  limit?: number;       // Pour full graph (default: 100)
}

interface UseGraphReturn {
  data: GraphData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}
```

---

## ✅ Tache 5: Correction SSE Flow - COMPLETE (Bonus)

### Description

Correction du flux SSE pour la generation de pages.

### Problemes corriges

| Probleme | Solution |
|----------|----------|
| `event.data.page` incorrect | ✅ Corrige: `event.page` directement |
| `event.data.content` incorrect | ✅ Corrige: `event.content` directement |
| `event.data.entity` incorrect | ✅ Corrige: `event.entity` directement |
| Types SSEEvent incomplets | ✅ Ajoute `content`, `entity`, `page` optionnels |

### Fichiers modifies

```
frontend/types/index.ts     # ✅ SSEEvent etendu
frontend/hooks/useSSE.ts    # ✅ Lecture correcte des events
frontend/lib/sse.ts         # ✅ Mock SSE mis a jour
```

---

## ✅ Tache 6: SuccessCard Component - COMPLETE (Bonus)

### Description

Composant de succes distinctif pour la fin de generation.

### Fichier

```
frontend/components/generation/SuccessCard.tsx  # ✅ Cree
frontend/app/globals.css                        # ✅ Animation animate-float
```

### Features

| Feature | Status |
|---------|--------|
| Animation d'entree staggered | ✅ |
| Particules flottantes | ✅ |
| Bouton CTA avec shine effect | ✅ |
| Couleurs semantiques (success) | ✅ |
| Redirection auto 2.5s | ✅ |

---

## ✅ Tache 7: Navigation Slug Fix - COMPLETE (Bonus)

### Description

Correction de la navigation vers les pages wiki.

### Probleme

Le GraphNode n'avait pas de `slug`, utilisant le `label` pour la navigation.

### Solution

| Fichier | Modification |
|---------|--------------|
| `backend/src/types/index.ts` | ✅ Ajoute `slug?: string` a GraphNode |
| `frontend/types/index.ts` | ✅ Ajoute `slug?: string` a GraphNode |
| `backend/src/services/graph.service.ts` | ✅ Inclut slug dans getFullGraph/getLocalGraph |
| `frontend/app/explore/page.tsx` | ✅ Utilise `node.slug` pour navigation |

---

## Tache 8: Tests E2E (optionnel) - PENDING

### Description

Tests de bout en bout pour le flow principal.

### Scenarios

1. **Homepage → Search → Generation → Wiki**
   - Aller sur `/`
   - Rechercher "Tesla"
   - Voir le GenerationProgress
   - Redirection vers `/wiki/tesla`
   - Verifier le contenu

2. **Wiki → Explore**
   - Aller sur `/wiki/tesla`
   - Cliquer "Voir le graph"
   - Verifier que `/explore?page={id}` affiche le graph

3. **Sidebar Navigation**
   - Verifier les pages recentes
   - Verifier le mini-graph

### Outils

- Playwright ou Cypress
- Mock API pour tests isoles

---

## Resume

| Tache | Status | Effort |
|-------|--------|--------|
| Tache 1: Page Explore | ✅ Complete | ~2h |
| Tache 2: GraphControls | ✅ Complete | ~1h |
| Tache 3: Amelioration GraphView | ✅ Complete | ~1h |
| Tache 4: Hook useGraph | ✅ Complete | ~30min |
| Tache 5: Correction SSE | ✅ Complete | ~30min |
| Tache 6: SuccessCard | ✅ Complete | ~30min |
| Tache 7: Navigation Fix | ✅ Complete | ~20min |
| Tache 8: Tests E2E | ⏳ Pending | ~2h |

**Progression: 7/8 taches completees (87%)**

---

## Notes techniques

### Fichiers crees dans cette session

```
frontend/app/explore/page.tsx
frontend/hooks/useGraph.ts
frontend/components/graph/GraphControls.tsx
frontend/components/generation/SuccessCard.tsx
```

### Fichiers modifies dans cette session

```
frontend/components/graph/GraphView.tsx
frontend/types/index.ts
frontend/hooks/useSSE.ts
frontend/lib/sse.ts
frontend/app/globals.css
frontend/app/search/page.tsx
frontend/app/page.tsx
backend/src/types/index.ts
backend/src/services/graph.service.ts
```

### Couleurs par type (definies dans GraphView)

```typescript
const NODE_COLORS = {
  page: "#3b82f6",      // blue-500
  PERSON: "#60a5fa",    // blue-400
  ORGANIZATION: "#34d399", // emerald-400
  LOCATION: "#fbbf24",  // amber-400
  EVENT: "#a78bfa",     // violet-400
  CONCEPT: "#f472b6",   // pink-400
  WORK: "#818cf8",      // indigo-400
  OTHER: "#9ca3af",     // gray-400
};
```

### API disponibles

| Frontend | Backend |
|----------|---------|
| `api.graph.full()` | `GET /api/graph` |
| `api.graph.local(pageId)` | `GET /api/graph/local/:pageId` |
| `api.graph.entity(entityId)` | `GET /api/graph/entity/:entityId` |

---

## Commandes de test

```bash
# Frontend
cd frontend && npm run lint
cd frontend && npx tsc --noEmit
cd frontend && npm run build

# Backend
cd backend && npm run typecheck
cd backend && npm run lint
```
