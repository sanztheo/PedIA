# PedIA - Graph Visualization (Obsidian-style)

## Concept

PedIA affiche les connexions entre pages comme Obsidian : un graphe interactif de noeuds et liens, permettant une navigation visuelle dans la connaissance.

---

## Library Comparison

### Performance (1000+ Nodes)

| Library | Rendering | Performance | Best For |
|---------|-----------|-------------|----------|
| **react-force-graph** | Canvas/WebGL | Excellent | 2D/3D flexible |
| **Sigma.js** | WebGL | Excellent | Tres grands graphs |
| **D3.js** | SVG/Canvas | Bon | Customisation totale |
| **Cytoscape.js** | Canvas | Excellent | Analyse avancee |
| **vis.js** | Canvas | Bon | Simplicite |

### Recommandation PedIA

| Phase | Library | Raison |
|-------|---------|--------|
| MVP | react-force-graph (2D) | Simple, performant, React natif |
| Scale | Sigma.js | WebGL pour 5000+ nodes |
| 3D (optionnel) | react-force-graph-3d | Meme API que 2D |

---

## Data Model

### Node (GraphNode)

| Propriete | Type | Description |
|-----------|------|-------------|
| id | string | Identifiant unique |
| label | string | Texte affiche |
| slug | string | URL de la page |
| type | 'page' \| 'entity' | Type de noeud |
| category | EntityType | Pour entities |
| size | number | Taille visuelle |
| color | string | Couleur |
| x, y | number | Position (cache) |

### Link (GraphLink)

| Propriete | Type | Description |
|-----------|------|-------------|
| source | string | ID du noeud source |
| target | string | ID du noeud cible |
| type | string | Type de relation |
| strength | number | Force du lien (0-1) |
| label | string | Label optionnel |

---

## Couleurs par Type

| Type | Couleur | Hex |
|------|---------|-----|
| PERSON | Rouge | #ef4444 |
| ORGANIZATION | Bleu | #3b82f6 |
| LOCATION | Vert | #22c55e |
| CONCEPT | Violet | #a855f7 |
| EVENT | Orange | #f59e0b |
| PRODUCT | Cyan | #06b6d4 |
| page | Gris | #6b7280 |

---

## Views

### Full Graph (`/explore`)

Visualisation complete de toutes les pages et entites.

**Features** :
- Zoom/pan infini
- Filtrage par type
- Search dans le graph
- Clustering automatique
- Minimap

### Local Graph (Sidebar)

Graph autour de la page courante (depth 1-2).

**Features** :
- Page courante highlightee
- Connexions directes visibles
- Click pour naviguer
- Compact (150x100px)

---

## Interactions

### Mouse

| Action | Resultat |
|--------|----------|
| Click node | Naviguer vers page |
| Hover node | Afficher tooltip |
| Drag node | Repositionner |
| Scroll | Zoom in/out |
| Drag background | Pan |

### Touch (Mobile)

| Action | Resultat |
|--------|----------|
| Tap node | Naviguer vers page |
| Long press | Afficher tooltip |
| Pinch | Zoom |
| Two-finger drag | Pan |

### Keyboard

| Touche | Action |
|--------|--------|
| +/- | Zoom |
| Arrows | Pan |
| Home | Center view |
| Escape | Deselect |
| / | Focus search |

---

## Controls

### Toolbar

| Bouton | Action |
|--------|--------|
| Zoom + | Zoom in |
| Zoom - | Zoom out |
| Center | Reset view |
| Filter | Ouvrir panel filtres |
| Fullscreen | Toggle fullscreen |

### Filters Panel

- Checkboxes par type d'entite
- Slider pour minimum connexions
- Search text
- Reset filters

---

## Minimap

Position : Coin inferieur droit

**Features** :
- Vue d'ensemble du graph
- Rectangle indiquant viewport
- Click pour naviguer
- Draggable viewport rectangle

---

## Physics Simulation

### Parametres (Obsidian-like)

| Parametre | Valeur | Description |
|-----------|--------|-------------|
| linkDistance | 100-200 | Distance cible entre noeuds lies |
| chargeStrength | -300 | Force de repulsion |
| centerStrength | 0.5 | Attraction vers centre |
| friction | 0.85 | Amortissement |
| alphaDecay | 0.02 | Vitesse de stabilisation |

### Cooldown

- Simulation active pendant 3 secondes
- Puis freeze pour performance
- Reactive au drag

---

## Performance Optimizations

### Level of Detail (LOD)

| Zoom Level | Rendering |
|------------|-----------|
| < 0.5 | Nodes seulement, pas de labels |
| 0.5 - 1.5 | Nodes + labels principaux |
| > 1.5 | Tout affiche |

### Viewport Culling

Ne rendre que les noeuds visibles + marge.
Economise 50-80% de rendering sur grands graphs.

### Web Worker

Calcul de la physique dans un worker separe.
Evite de bloquer le main thread.

### Canvas vs SVG

- Canvas pour > 100 nodes
- SVG seulement pour tres petits graphs

---

## Data Fetching

### Full Graph

- Endpoint : `GET /api/graph`
- Pagination : limit/offset
- Cache SWR : 30 secondes

### Local Graph

- Endpoint : `GET /api/graph/local/:pageId?depth=2`
- Depth : 1-3 (defaut 2)
- Cache SWR : 30 secondes

### Incremental Updates

Quand une page est creee/modifiee:
- WebSocket notification (futur)
- Ou polling toutes les 60s
- Merge avec graph existant

---

## Accessibility

### Screen Readers

- Description du graph (nombre nodes/links)
- Liste navigable des nodes
- Annonce des connexions

### High Contrast

- Mode high contrast disponible
- Couleurs ajustees pour daltonisme

### Keyboard Navigation

- Tab entre nodes
- Enter pour activer
- Fleches pour se deplacer

---

## Mobile Specifics

### Layout

- Full width
- Controls en bas
- Minimap cachee (trop petit)

### Performance

- Max 500 nodes affiches
- 2D seulement
- Animations reduites

### Gestures

- Pinch to zoom
- Two finger pan
- Double tap to center on node

---

## 3D Graph (Phase 2)

### Quand ?

Optionnel, pour experience immersive.

### Technologies

- react-force-graph-3d
- Three.js
- WebGL

### Considerations

- Plus lourd en ressources
- Peut causer motion sickness
- Necessite bonne GPU

---

## Voir Aussi

- [Frontend Architecture](../architecture/frontend.md)
- [Database Design](../architecture/database.md)
- [Entity Extraction](./entity-extraction.md)
