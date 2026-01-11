# PedIA - Frontend Architecture

## Stack

| Technologie | Role |
|-------------|------|
| Next.js 15 | Framework (App Router) |
| Tailwind CSS | Styling |
| SWR | Data fetching + cache |
| Vercel AI SDK | Streaming AI |
| react-force-graph | Visualisation graph |
| Framer Motion | Animations |

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
|   |   |   +-- SearchProgress.tsx
|   |   |   +-- SearchResults.tsx
|   |   +-- page/
|   |   |   +-- PageContent.tsx
|   |   |   +-- PageLinks.tsx
|   |   |   +-- PageMetadata.tsx
|   |   +-- graph/
|   |   |   +-- GraphView.tsx
|   |   |   +-- GraphMinimap.tsx
|   |   |   +-- GraphControls.tsx
|   |   +-- layout/
|   |       +-- Sidebar.tsx
|   |       +-- Header.tsx
|   +-- hooks/
|   |   +-- useSearch.ts
|   |   +-- useGraph.ts
|   |   +-- usePage.ts
|   +-- services/
|   |   +-- api.ts
|   +-- types/
+-- public/
+-- next.config.js
+-- tailwind.config.js
```

---

## Pages Principales

### 1. Homepage (`/`)

**Design** : Minimaliste, search centree
- Logo + tagline
- Barre de recherche prominente
- Pas de sidebar

### 2. Page Encyclopedie (`/page/[slug]`)

**Design** : Article style Wikipedia
- Titre + metadata en haut
- Contenu markdown rendu
- Sidebar avec liens connexes
- Mini-graph local

**SSR** : Oui (SEO critique)

### 3. Search Progress (`/search`)

**Design** : Vue temps reel generation
- Liste des etapes avec status
- Contenu qui se genere en streaming
- Entites detectees en temps reel
- Sources utilisees

### 4. Graph Explorer (`/explore`)

**Design** : Plein ecran
- Graph interactif centre
- Controles zoom/pan
- Minimap en coin
- Filtres par type d'entite

---

## Composants Cles

### SearchProgress

Affiche les etapes de generation AI:
- Icone de status (pending/loading/done/error)
- Label de l'etape
- Details optionnels
- Duree d'execution

**Etapes affichees** :
1. Recherche web
2. Analyse des sources
3. Verification
4. Generation du contenu
5. Extraction des entites
6. Creation des liens
7. Sauvegarde

### GraphView

Visualisation des liens entre pages:
- Noeuds = pages/entites
- Liens = relations
- Couleurs par type d'entite
- Taille par nombre de connexions

**Interactions** :
- Click = naviguer vers page
- Hover = tooltip avec details
- Drag = repositionner
- Scroll = zoom

### Sidebar

Navigation persistante:
- Logo + lien accueil
- Mini-graph local (si sur une page)
- Pages recentes
- Bouton "Toutes les pages"

---

## Patterns de Data Fetching

### Server Components (Default)

Pages encyclopedie utilisent Server Components:
- Fetch cote serveur
- HTML pre-rendu
- SEO optimal
- Cache CDN

### Client Components

Parties interactives:
- SearchProgress (streaming)
- GraphView (interactions)
- SearchBar (input)

### SWR pour Cache Client

- Revalidation automatique
- Cache local
- Optimistic updates
- Deduplication des requetes

---

## Streaming Pattern

### SSE (Server-Sent Events)

Le frontend se connecte a l'endpoint SSE:
1. Ouvre connexion EventSource
2. Recoit events en temps reel
3. Met a jour l'UI incrementalement
4. Ferme a la completion

### Types d'Events

| Event | Contenu | Action UI |
|-------|---------|-----------|
| step_start | Step ID, details | Marquer etape en cours |
| step_complete | Step ID | Marquer etape terminee |
| content_chunk | Texte partiel | Append au contenu |
| entity_found | Entite detectee | Ajouter a la liste |
| complete | Page ID, slug | Rediriger vers page |

---

## Responsive Design

### Breakpoints

| Breakpoint | Comportement |
|------------|--------------|
| Mobile (< 768px) | Sidebar cachee, menu burger |
| Tablet (768-1024px) | Sidebar reduite |
| Desktop (> 1024px) | Sidebar complete |

### Graph sur Mobile

- 2D uniquement (pas de 3D)
- Controles simplifies
- Touch gestures pour zoom/pan

---

## Performance Optimizations

### 1. Server Components

Tout ce qui peut etre SSR l'est:
- Pages encyclopedie
- Metadata
- Navigation

### 2. Lazy Loading

Composants lourds charges a la demande:
- GraphView (react-force-graph est lourd)
- Markdown editor (si edition)

### 3. Image Optimization

Next.js Image component:
- WebP automatique
- Lazy loading
- Responsive sizes

### 4. Route Prefetching

Next.js prefetch les liens visibles:
- Pages populaires prechargees
- Navigation instantanee

---

## Voir Aussi

- [Architecture Overview](./overview.md)
- [Streaming UI](../features/streaming-ui.md)
- [Graph Visualization](../features/graph-visualization.md)
