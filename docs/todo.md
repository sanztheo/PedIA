# PedIA - TODO Implementation

## Vue d'ensemble

Ce document liste les taches restantes pour completer le MVP de PedIA.
Chaque tache suit le workflow EPCT (Explore, Plan, Code, Test).

---

## Tache 1: Page Explore (Graph Visualization)

### Description

Creer la page `/explore` pour la visualisation du graph en plein ecran.
Le bouton "Voir le graph" dans `PageHeader` pointe vers `/explore?page={pageId}` mais cette page n'existe pas.

### Specifications (voir `docs/features/graph-visualization.md`)

| Feature | Description |
|---------|-------------|
| Full Graph | Visualisation complete de toutes les pages et entites |
| Local Graph | Si `?page={pageId}`, centrer sur cette page |
| Zoom/Pan | Controles de navigation |
| Filtres | Par type d'entite (PERSON, ORGANIZATION, etc.) |
| Search | Recherche dans le graph |

### Fichiers a creer

```
frontend/app/explore/page.tsx        # Page principale
frontend/components/graph/GraphControls.tsx  # Controles zoom/pan/filtres
```

### API disponibles

| Endpoint | Usage |
|----------|-------|
| `GET /api/graph?limit=100` | Graph complet pagine |
| `GET /api/graph/local/{pageId}?depth=2` | Graph local autour d'une page |
| `GET /api/graph/entity/{entityId}` | Relations d'une entite |

### UI Reference

Style Obsidian-like:
- Graph centre, prend tout l'espace
- Toolbar en haut avec controles
- Panel filtres a droite (collapsible)
- Minimap en bas a droite (optionnel)

### Acceptance Criteria

- [ ] `/explore` affiche le graph complet
- [ ] `/explore?page={pageId}` centre sur la page specifique
- [ ] Controles zoom +/- et reset
- [ ] Click sur un noeud navigue vers `/wiki/{slug}`
- [ ] Filtres par type d'entite fonctionnels
- [ ] Responsive (fonctionne sur mobile)

---

## Tache 2: GraphControls Component

### Description

Composant de controles pour le GraphView (zoom, pan, filtres).

### Fichier

```
frontend/components/graph/GraphControls.tsx
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

### UI Elements

| Element | Action |
|---------|--------|
| Bouton + | Zoom in |
| Bouton - | Zoom out |
| Bouton Reset | Recentrer la vue |
| Toggles par type | Filtrer les entites par type |

### Style

- Floating toolbar style shadcn
- Icons Lucide: ZoomIn, ZoomOut, Maximize2, Filter
- Tooltips sur hover

---

## Tache 3: Amelioration GraphView

### Description

Ajouter les fonctionnalites manquantes au GraphView existant.

### Fichier existant

```
frontend/components/graph/GraphView.tsx
```

### Ameliorations

| Feature | Status | Description |
|---------|--------|-------------|
| Zoom programmatique | A ajouter | Expose `zoomIn()`, `zoomOut()`, `reset()` |
| Filtrage | A ajouter | Prop `filters: EntityType[]` |
| Highlight node | A ajouter | Prop `highlightedId?: string` |
| Responsive | A ameliorer | Auto-resize avec container |

### API exposee (via ref ou callbacks)

```typescript
interface GraphViewRef {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  centerOn: (nodeId: string) => void;
}
```

---

## Tache 4: Hook useGraph

### Description

Hook custom pour gerer le fetching et le state du graph.

### Fichier

```
frontend/hooks/useGraph.ts
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

### Implementation

- Utiliser SWR pour cache et revalidation
- Si `pageId` → appeler `/api/graph/local/{pageId}`
- Sinon → appeler `/api/graph`

---

## Tache 5: Integration Tests E2E (optionnel)

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

## Priorites

| Priorite | Tache | Effort |
|----------|-------|--------|
| P0 | Tache 1: Page Explore | ~2h |
| P0 | Tache 2: GraphControls | ~1h |
| P1 | Tache 3: Amelioration GraphView | ~1h |
| P1 | Tache 4: Hook useGraph | ~30min |
| P2 | Tache 5: Tests E2E | ~2h |

**Total estime: ~6-7h**

---

## Dependances

```
Tache 2 (GraphControls) → Tache 1 (Page Explore)
Tache 4 (useGraph) → Tache 1 (Page Explore)
Tache 3 (GraphView) → Tache 1 (Page Explore)
```

Ordre recommande:
1. Tache 4: useGraph
2. Tache 2: GraphControls
3. Tache 3: Amelioration GraphView
4. Tache 1: Page Explore

---

## Notes techniques

### Pattern a suivre

Regarder les composants existants:
- `frontend/components/search/SearchBar.tsx` - Style shadcn
- `frontend/components/wiki/EntitySidebar.tsx` - Badges par type
- `frontend/app/search/page.tsx` - Page avec SSE

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
cd frontend && npm run build

# Backend
cd backend && npm run typecheck
cd backend && npm run lint
```
