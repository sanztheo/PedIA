# PedIA - Attribution des Taches

## IMPORTANT POUR LES IA

**AVANT DE CODER, LIS:**
1. `.cursorrules` - regles du projet
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

## ~~Theo - Backend AI + Frontend Streaming~~ ✅ COMPLETE + REVIEWED

### TACHES COMPLETEES

- ✅ `backend/src/ai/agent.ts` - refacto: validation input + AI entity extraction
- ✅ `backend/src/ai/prompts.ts`
- ✅ `backend/src/ai/tools/search.tool.ts`
- ✅ `backend/src/ai/tools/entity.tool.ts` - simplifie: AI-first, regex fallback
- ✅ `backend/src/routes/generate.ts` - refacto: transaction atomique Prisma
- ✅ `frontend/components/generation/GenerationProgress.tsx`
- ✅ `frontend/components/graph/GraphView.tsx`
- ✅ `frontend/app/search/page.tsx`
- ✅ `frontend/lib/sse.ts` - fix: error handling SSE

---

## ~~Kofu - Backend Services + Routes~~ ✅ COMPLETE

### TACHES COMPLETEES

- ✅ `backend/src/services/page.service.ts` - CRUD complet + cache Redis sur getBySlug
- ✅ `backend/src/services/entity.service.ts` - create, getById, findByName, list, linkToPage
- ✅ `backend/src/services/graph.service.ts` - getFullGraph, getLocalGraph, getEntityRelations
- ✅ `backend/src/services/index.ts` - exports centralisés
- ✅ `backend/src/routes/pages.ts` - GET, POST, PATCH, DELETE avec validation
- ✅ `backend/src/routes/graph.ts` - GET /api/graph, GET /api/graph/local/:pageId, GET /api/graph/entity/:entityId
- ✅ `backend/src/routes/search.ts` - GET /api/search?q=... avec full-text Prisma + cache Redis

### TESTS
```bash
npm run typecheck
node --env-file=.env --import=tsx tests/pages.test.ts
node --env-file=.env --import=tsx tests/graph.test.ts
```

---

## ~~Nixou - Queue Workers~~ ✅ COMPLETE + REVIEWED

### TACHES COMPLETEES

- ✅ `backend/src/queue/queues.ts` - Setup des 3 queues BullMQ (extract, link, enrich)
- ✅ `backend/src/queue/workers/extractWorker.ts` - Extraction entites avec AI + fallback regex
- ✅ `backend/src/queue/workers/linkWorker.ts` - Deduplication entites + creation relations
- ✅ `backend/src/queue/workers/enrichWorker.ts` - Generation pages manquantes pour entites importantes
- ✅ `backend/src/queue/index.ts` - startAllWorkers(), stopAllWorkers(), getWorkersHealth()
- ✅ `backend/tests/queue.test.ts` - Tests complets du systeme de queues
- ✅ Upgrade AI SDK v4 → v6 + providers compatibles

### ARCHITECTURE IMPLEMENTEE

```
Page generee → ExtractWorker (AI extraction)
                     ↓
               LinkWorker (dedup + relations)
                     ↓
               EnrichWorker (genere pages manquantes)
                     ↓
               (boucle) → ExtractWorker...
```

### TESTS
```bash
npm run typecheck
node --env-file=.env --import=tsx tests/queue.test.ts
```

---

## Glamgar - Full Frontend

### MISSION
Implementer toute l'interface: layout, homepage, wiki display.

### TACHES COMPLETEES

**Phase 1: Layout** ✅

- ✅ **Tache 4: SearchBar** - `frontend/components/search/SearchBar.tsx`
  - Input clean style shadcn + kbd hint + loader

**Phase 2: Pages** ✅

- ✅ **Tache 5: Homepage** - `frontend/app/page.tsx`
  - Design minimal style Linear/Vercel
  - Header avec nav, SearchBar centree, features inline

- ✅ **Tache 6: Search Page** - `frontend/app/search/page.tsx`
  - Redesign complet style shadcn
  - GenerationProgress integre

- ✅ **GenerationProgress** - `frontend/components/generation/GenerationProgress.tsx`
  - Redesign minimal: steps en liste, apercu, entites en tags

### TACHES A FAIRE

**Phase 1: Layout (restant)**

**Tache 1: MainLayout**
- Fichier: `frontend/components/layout/MainLayout.tsx`
- Structure: Header + Sidebar + main content

**Tache 2: Header** (extraire de page.tsx)
- Fichier: `frontend/components/layout/Header.tsx`
- Reutiliser le header existant

**Tache 3: Sidebar**
- Fichier: `frontend/components/layout/Sidebar.tsx`
- Navigation, pages recentes

**Phase 3: Wiki**

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
frontend/lib/api.ts
frontend/hooks/useSSE.ts
frontend/types/index.ts
frontend/components/graph/GraphView.tsx
frontend/components/generation/GenerationProgress.tsx
```

### TESTS
```bash
npm run lint
npm run build
```

---

## Stack Rappel

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, Tailwind, SWR, react-markdown |
| Backend | Hono, Prisma, BullMQ, Vercel AI SDK v6 |
| Database | PostgreSQL, Redis |
| AI | Gemini / OpenAI / Claude |

---

## Regles

1. **Lire `.cursorrules` avant de coder**
2. **Utiliser les fichiers existants**
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
