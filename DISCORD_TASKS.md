# PedIA - Attribution des Taches

## IMPORTANT POUR LES IA

**AVANT DE CODER, LIS:**
1. `.cursorrules` - Regles du projet
2. `docs/architecture/` - Architecture technique
3. Ce fichier - Ta mission specifique

---

## Structure du Projet

```
pedia/
├── frontend/          # Next.js 15 + Tailwind
├── backend/           # Hono + Prisma + BullMQ
└── docs/              # Documentation technique
```

---

## Nixou - Backend API + Database

### MISSION
Implementer les services CRUD et routes API pour pages, entites et graph.

### TACHES A FAIRE (dans l'ordre)

**Tache 1: PageService**
- Fichier: `backend/src/services/page.service.ts`
- Fonctions: create, getBySlug, list, update, delete
- Utiliser: `import prisma from "../lib/prisma"`

**Tache 2: EntityService**
- Fichier: `backend/src/services/entity.service.ts`
- Fonctions: create, getById, findByName, list, linkToPage
- Utiliser: `import prisma from "../lib/prisma"`

**Tache 3: GraphService**
- Fichier: `backend/src/services/graph.service.ts`
- Fonctions: getFullGraph, getLocalGraph, getEntityRelations
- Utiliser: `import prisma from "../lib/prisma"`

**Tache 4: Completer routes pages.ts**
- Fichier: `backend/src/routes/pages.ts`
- Importer PageService et implementer les handlers

**Tache 5: Completer routes graph.ts**
- Fichier: `backend/src/routes/graph.ts`
- Importer GraphService et implementer les handlers

**Tache 6: Completer routes search.ts**
- Fichier: `backend/src/routes/search.ts`
- Implementer recherche full-text avec Prisma

### FICHIERS EXISTANTS A UTILISER
```
backend/src/lib/prisma.ts     # Client Prisma - UTILISE CA
backend/src/lib/redis.ts      # Cache - getCache, setCache, deleteCache
backend/src/types/index.ts    # Types partages
```

### TESTS
```bash
npx tsx tests/pages.test.ts
npx tsx tests/graph.test.ts
```

### DOCS A LIRE
- `docs/architecture/backend.md`
- `docs/architecture/database.md`
- `backend/prisma/schema.prisma`

---

## Glamgar - Frontend Core + UI

### MISSION
Implementer l'interface utilisateur: homepage, layout, sidebar, composants de base.

### TACHES A FAIRE (dans l'ordre)

**Tache 1: MainLayout**
- Fichier: `frontend/components/layout/MainLayout.tsx`
- Props: children
- Structure: Header + Sidebar + main content
- Utiliser Tailwind

**Tache 2: Header**
- Fichier: `frontend/components/layout/Header.tsx`
- Contenu: Logo PedIA, navigation

**Tache 3: Sidebar**
- Fichier: `frontend/components/layout/Sidebar.tsx`
- Contenu: Navigation, liste pages recentes, mini graph (placeholder)

**Tache 4: SearchBar**
- Fichier: `frontend/components/search/SearchBar.tsx`
- Input avec icone recherche
- onSubmit redirige vers /search?q=...

**Tache 5: Homepage**
- Fichier: `frontend/app/page.tsx`
- Style Google: logo centre + SearchBar centre
- Fond clean, minimaliste

**Tache 6: Layout racine**
- Fichier: `frontend/app/layout.tsx`
- Integrer MainLayout
- Setup dark mode Tailwind

**Tache 7: Page wiki**
- Fichier: `frontend/app/wiki/[slug]/page.tsx`
- Fetch page via api.pages.get(slug)
- Afficher titre + contenu markdown

### FICHIERS EXISTANTS A UTILISER
```
frontend/lib/api.ts           # Client API - import { api } from "@/lib/api"
frontend/types/index.ts       # Types Page, Entity, etc.
```

### TESTS
```bash
npm run lint
npm run build
```

### DOCS A LIRE
- `docs/architecture/frontend.md`
- `docs/features/streaming-ui.md`

---

## ~~Theo - Backend AI + Frontend Streaming~~ ✅ COMPLETE

### MISSION
~~Implementer le pipeline AI de generation et l'UI de streaming/graph.~~

### TACHES COMPLETEES

- ✅ **Tache 1: Agent AI** - `backend/src/ai/agent.ts`
- ✅ **Tache 2: Prompts** - `backend/src/ai/prompts.ts`
- ✅ **Tache 3: Web Search Tool** - `backend/src/ai/tools/search.tool.ts`
- ✅ **Tache 4: Entity Tool** - `backend/src/ai/tools/entity.tool.ts`
- ✅ **Tache 5: Route generate.ts** - `backend/src/routes/generate.ts`
- ✅ **Tache 6: GenerationProgress** - `frontend/components/generation/GenerationProgress.tsx`
- ✅ **Tache 7: GraphView** - `frontend/components/graph/GraphView.tsx`
- ✅ **Tache 8: Page search** - `frontend/app/search/page.tsx`

---

## Kofu - Queue Workers + Wiki Display

### MISSION
Implementer les workers BullMQ pour le traitement async et la page wiki avec rendu markdown.

### TACHES A FAIRE (dans l'ordre)

**Tache 1: Queue Setup**
- Fichier: `backend/src/queue/queues.ts`
- Creer les queues: extract, link, enrich
- Utiliser BullMQ + Redis

**Tache 2: Extract Worker**
- Fichier: `backend/src/queue/workers/extractWorker.ts`
- Traiter les jobs d'extraction d'entites apres generation
- Utiliser: `import { extractEntities } from "../../ai/tools/entity.tool"`

**Tache 3: Link Worker**
- Fichier: `backend/src/queue/workers/linkWorker.ts`
- Deduplication des entites
- Creation des relations entre entites

**Tache 4: Enrich Worker**
- Fichier: `backend/src/queue/workers/enrichWorker.ts`
- Creer les pages manquantes pour les entites importantes
- Utiliser: `import { generatePage } from "../../ai/agent"`

**Tache 5: Wiki Page Display**
- Fichier: `frontend/app/wiki/[slug]/page.tsx`
- Fetch page depuis API
- Rendu markdown avec react-markdown
- Afficher entites liees en sidebar

**Tache 6: Markdown Component**
- Fichier: `frontend/components/wiki/MarkdownContent.tsx`
- Rendu markdown avec syntax highlighting
- Convertir [[Entity]] en liens internes

**Tache 7: Entity Sidebar**
- Fichier: `frontend/components/wiki/EntitySidebar.tsx`
- Liste des entites de la page
- Badges par type (PERSON, ORG, LOCATION...)

**Tache 8: Page Header**
- Fichier: `frontend/components/wiki/PageHeader.tsx`
- Titre, date de creation, nombre de vues
- Bouton "Voir le graph"

### FICHIERS EXISTANTS A UTILISER
```
backend/src/lib/prisma.ts
backend/src/lib/redis.ts
backend/src/ai/agent.ts           # generatePage()
backend/src/ai/tools/entity.tool.ts
frontend/lib/api.ts
frontend/types/index.ts
```

### TESTS
```bash
npx tsx tests/queue.test.ts
npm run typecheck
```

### DOCS A LIRE
- `docs/architecture/backend.md` (section Queue System)
- `docs/features/entity-extraction.md`

---

## Stack Rappel

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, Tailwind, SWR, react-force-graph |
| Backend | Hono, Prisma, BullMQ, Vercel AI SDK |
| Database | PostgreSQL (pgvector), Redis |
| AI | Gemini / OpenAI / Claude (au choix) |

---

## Regles

1. **Lire `.cursorrules` avant de coder**
2. **Utiliser les fichiers existants** (prisma.ts, api.ts, etc.)
3. **Tester apres chaque implementation**
4. **Pas de comments inutiles dans le code**
5. **Noms clairs > comments**

---

## Setup

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run db:generate
npm run dev

# Frontend
cd frontend
cp .env.example .env
npm install
npm run dev
```
