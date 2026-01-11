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

## ~~Theo - Backend AI + Frontend Streaming~~ ✅ COMPLETE

### TACHES COMPLETEES

- ✅ `backend/src/ai/agent.ts`
- ✅ `backend/src/ai/prompts.ts`
- ✅ `backend/src/ai/tools/search.tool.ts`
- ✅ `backend/src/ai/tools/entity.tool.ts`
- ✅ `backend/src/routes/generate.ts`
- ✅ `frontend/components/generation/GenerationProgress.tsx`
- ✅ `frontend/components/graph/GraphView.tsx`
- ✅ `frontend/app/search/page.tsx`

---

## Kofu - Full Backend (Services + Routes + Workers)

### MISSION
Implementer tous les services backend, routes API et workers BullMQ.

### TACHES A FAIRE (dans l'ordre)

**Phase 1: Services**

**Tache 1: PageService**
- Fichier: `backend/src/services/page.service.ts`
- Fonctions: create, getBySlug, list, update, delete
- Cache Redis sur getBySlug

**Tache 2: EntityService**
- Fichier: `backend/src/services/entity.service.ts`
- Fonctions: create, getById, findByName, list, linkToPage

**Tache 3: GraphService**
- Fichier: `backend/src/services/graph.service.ts`
- Fonctions: getFullGraph, getLocalGraph, getEntityRelations

**Phase 2: Routes**

**Tache 4: Routes pages.ts**
- Fichier: `backend/src/routes/pages.ts`
- GET /api/pages, GET /api/pages/:slug, POST, PATCH, DELETE

**Tache 5: Routes graph.ts**
- Fichier: `backend/src/routes/graph.ts`
- GET /api/graph, GET /api/graph/local/:pageId

**Tache 6: Routes search.ts**
- Fichier: `backend/src/routes/search.ts`
- GET /api/search?q=... avec full-text Prisma

**Phase 3: Queue Workers**

**Tache 7: Queue Setup**
- Fichier: `backend/src/queue/queues.ts`
- Creer les queues: extract, link, enrich
- Utiliser BullMQ + Redis

**Tache 8: Extract Worker**
- Fichier: `backend/src/queue/workers/extractWorker.ts`
- Extraction entites apres generation

**Tache 9: Link Worker**
- Fichier: `backend/src/queue/workers/linkWorker.ts`
- Deduplication + creation relations

**Tache 10: Enrich Worker**
- Fichier: `backend/src/queue/workers/enrichWorker.ts`
- Generation pages manquantes

### FICHIERS A UTILISER
```
backend/src/lib/prisma.ts         # import prisma from "../lib/prisma"
backend/src/lib/redis.ts          # import { getCache, setCache } from "../lib/redis"
backend/src/ai/agent.ts           # import { generatePage } from "../ai/agent"
backend/src/ai/tools/entity.tool.ts
backend/src/types/index.ts
```

### TESTS
```bash
npm run typecheck
npx tsx tests/pages.test.ts
npx tsx tests/graph.test.ts
npx tsx tests/queue.test.ts
```

### DOCS A LIRE
- `docs/architecture/backend.md`
- `docs/architecture/database.md`
- `backend/prisma/schema.prisma`

---

## Glamgar - Full Frontend (UI + Wiki)

### MISSION
Implementer toute l'interface: layout, homepage, wiki display, composants.

### TACHES A FAIRE (dans l'ordre)

**Phase 1: Layout & Navigation**

**Tache 1: MainLayout**
- Fichier: `frontend/components/layout/MainLayout.tsx`
- Structure: Header + Sidebar + main content

**Tache 2: Header**
- Fichier: `frontend/components/layout/Header.tsx`
- Logo PedIA + navigation

**Tache 3: Sidebar**
- Fichier: `frontend/components/layout/Sidebar.tsx`
- Navigation, pages recentes

**Tache 4: SearchBar**
- Fichier: `frontend/components/search/SearchBar.tsx`
- Input + redirect vers /search?q=...

**Phase 2: Pages**

**Tache 5: Homepage**
- Fichier: `frontend/app/page.tsx`
- Style Google: logo + SearchBar centre

**Tache 6: Layout racine**
- Fichier: `frontend/app/layout.tsx`
- Integrer MainLayout + dark mode

**Phase 3: Wiki Display**

**Tache 7: Wiki Page**
- Fichier: `frontend/app/wiki/[slug]/page.tsx`
- Fetch page + rendu markdown + sidebar entites

**Tache 8: MarkdownContent**
- Fichier: `frontend/components/wiki/MarkdownContent.tsx`
- Rendu markdown + convertir [[Entity]] en liens

**Tache 9: EntitySidebar**
- Fichier: `frontend/components/wiki/EntitySidebar.tsx`
- Liste entites avec badges par type

**Tache 10: PageHeader**
- Fichier: `frontend/components/wiki/PageHeader.tsx`
- Titre, date, vues, bouton graph

### FICHIERS A UTILISER
```
frontend/lib/api.ts               # import { api } from "@/lib/api"
frontend/hooks/useSSE.ts          # import { useSSE } from "@/hooks/useSSE"
frontend/types/index.ts
frontend/components/graph/GraphView.tsx   # deja fait
frontend/components/generation/GenerationProgress.tsx  # deja fait
```

### TESTS
```bash
npm run lint
npm run build
npm run typecheck
```

### DOCS A LIRE
- `docs/architecture/frontend.md`
- `docs/features/streaming-ui.md`

---

## Stack Rappel

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, Tailwind, SWR, react-markdown |
| Backend | Hono, Prisma, BullMQ, Vercel AI SDK |
| Database | PostgreSQL, Redis |
| AI | Gemini / OpenAI / Claude |

---

## Regles

1. **Lire `.cursorrules` avant de coder**
2. **Utiliser les fichiers existants** (prisma.ts, api.ts, etc.)
3. **Tester apres chaque implementation**
4. **Pas de comments inutiles**
5. **Noms clairs > comments**

---

## Setup

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```
