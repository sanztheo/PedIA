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

## Theo - Backend AI + Frontend Streaming

### MISSION
Implementer le pipeline AI de generation et l'UI de streaming/graph.

### TACHES A FAIRE (dans l'ordre)

**Tache 1: Agent AI**
- Fichier: `backend/src/ai/agent.ts`
- Utiliser Vercel AI SDK
- Fonction: generatePage(query) avec streaming

**Tache 2: Prompts**
- Fichier: `backend/src/ai/prompts.ts`
- System prompts pour generation encyclopedie

**Tache 3: Web Search Tool**
- Fichier: `backend/src/ai/tools/search.tool.ts`
- Integration Tavily ou Serper

**Tache 4: Entity Tool**
- Fichier: `backend/src/ai/tools/entity.tool.ts`
- Extraction NER depuis contenu

**Tache 5: Route generate.ts**
- Fichier: `backend/src/routes/generate.ts`
- SSE streaming complet avec etapes

**Tache 6: GenerationProgress**
- Fichier: `frontend/components/generation/GenerationProgress.tsx`
- Afficher etapes: search, analyze, generate, extract, save
- Utiliser: `import { useSSE } from "@/hooks/useSSE"`

**Tache 7: GraphView**
- Fichier: `frontend/components/graph/GraphView.tsx`
- Utiliser react-force-graph
- Afficher nodes et links

**Tache 8: Page search**
- Fichier: `frontend/app/search/page.tsx`
- Integrer GenerationProgress
- Redirect vers wiki/[slug] quand complete

### FICHIERS EXISTANTS A UTILISER
```
backend/src/lib/prisma.ts
backend/src/lib/redis.ts
backend/src/types/index.ts
frontend/lib/sse.ts           # createSSEConnection, createMockSSE
frontend/hooks/useSSE.ts      # Hook pret a utiliser
frontend/types/index.ts
```

### TESTS
```bash
npx tsx tests/generate.test.ts
npm run typecheck
```

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
