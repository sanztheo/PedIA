# PedIA - Attribution des Taches

Yo l'equipe, voici la repartition des taches pour PedIA.

---

## Structure du Projet

```
pedia/
├── frontend/          # Next.js 15 + Tailwind
├── backend/           # Hono + Prisma + BullMQ
└── docs/              # Documentation technique
```

---

## Theo - Backend AI Pipeline

**Focus:** Generation IA, streaming, extraction d'entites

### Premiere tache: Pipeline de generation SSE

Implementer le endpoint `/api/generate` qui:
1. Recoit une query
2. Lance une recherche web (Tavily/Serper)
3. Genere le contenu avec Vercel AI SDK (Gemini/OpenAI/Claude)
4. Stream les etapes en SSE vers le frontend
5. Extrait les entites du contenu genere

### Fichiers a creer:
```
backend/src/
├── ai/
│   ├── agent.ts              # PREMIER FICHIER - Orchestration AI
│   ├── prompts.ts            # System prompts
│   └── tools/
│       ├── search.tool.ts    # Tool recherche web
│       └── entity.tool.ts    # Tool extraction entites
├── services/
│   ├── generation.service.ts
│   ├── websearch.service.ts
│   └── ner.service.ts
└── routes/
    └── generate.ts           # Completer le SSE streaming
```

### Pour commencer:
```bash
cd backend
npm install ai @ai-sdk/google @ai-sdk/openai
# Puis creer src/ai/agent.ts
```

---

## Nixou - Backend API + Database

**Focus:** API REST, services, base de donnees

### Premiere tache: Services CRUD Pages

Implementer les services de base pour les pages:
1. PageService - CRUD complet
2. EntityService - gestion des entites
3. Routes pages fonctionnelles
4. Integration Prisma

### Fichiers a creer:
```
backend/src/
├── lib/
│   ├── prisma.ts             # PREMIER FICHIER - Client Prisma
│   └── redis.ts              # Client Redis (cache)
├── services/
│   ├── page.service.ts       # CRUD pages
│   ├── entity.service.ts     # CRUD entites
│   └── graph.service.ts      # Relations graph
└── routes/
    ├── pages.ts              # Completer les routes
    ├── graph.ts              # Completer les routes
    └── search.ts             # Completer les routes
```

### Pour commencer:
```bash
cd backend
# Creer src/lib/prisma.ts avec le client
# Puis src/services/page.service.ts
```

---

## Mirochill - Frontend Streaming + Graph

**Focus:** SSE streaming UI, visualisation graphe

### Premiere tache: Composant de progression SSE

Implementer l'UI de progression quand l'AI genere:
1. Hook useSSE pour ecouter les events
2. Composant GenerationProgress avec les etapes
3. Animations de chargement
4. Integration avec la page de recherche

### Fichiers a creer:
```
frontend/
├── hooks/
│   └── useSSE.ts             # PREMIER FICHIER - Hook SSE
├── lib/
│   └── sse.ts                # Client SSE
├── components/
│   ├── generation/
│   │   ├── GenerationProgress.tsx
│   │   └── StepIndicator.tsx
│   └── graph/
│       ├── GraphView.tsx
│       └── GraphSidebar.tsx
└── app/
    └── search/
        └── page.tsx          # Page de recherche avec progress
```

### Pour commencer:
```bash
cd frontend
npm install eventsource-parser
# Puis creer hooks/useSSE.ts
```

---

## Glamgar - Frontend Core + UI

**Focus:** Interface utilisateur, composants de base

### Premiere tache: Homepage + Layout

Implementer la structure de base:
1. Homepage avec recherche centree (style Google)
2. Layout principal avec sidebar
3. Composants de base (SearchBar, Header)
4. Setup Tailwind avec dark mode

### Fichiers a creer:
```
frontend/
├── components/
│   ├── layout/
│   │   ├── MainLayout.tsx    # PREMIER FICHIER - Layout principal
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── search/
│   │   └── SearchBar.tsx
│   └── ui/
│       └── Button.tsx
├── app/
│   ├── page.tsx              # Homepage (modifier)
│   ├── layout.tsx            # Root layout (modifier)
│   └── wiki/
│       └── [slug]/
│           └── page.tsx
└── lib/
    └── api.ts                # Client API
```

### Pour commencer:
```bash
cd frontend
# Modifier app/page.tsx pour la homepage
# Puis creer components/layout/MainLayout.tsx
```

---

## Setup Initial (pour tous)

```bash
# Clone + install
git clone <repo>
cd pedia

# Backend
cd backend
cp .env.example .env
# Remplir .env avec tes cles
npm install
npm run db:generate   # Genere le client Prisma
npm run dev

# Frontend (autre terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

---

## Stack Rappel

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, Tailwind, SWR, react-force-graph |
| Backend | Hono, Prisma, BullMQ, Vercel AI SDK |
| Database | PostgreSQL (pgvector), Redis |
| AI | Gemini / OpenAI / Claude (au choix) |
| Embeddings | text-embedding-3-small (OpenAI) |

---

## Ordre des Priorites

### Sprint 1 - Fondations
1. **Glamgar** - Homepage + Layout + SearchBar
2. **Nixou** - Prisma client + PageService + routes pages
3. **Mirochill** - Hook useSSE + GenerationProgress basique
4. **Theo** - Agent AI + generation SSE basique

### Sprint 2 - Core Features
1. **Glamgar** - Page wiki/[slug] + MarkdownRenderer
2. **Nixou** - EntityService + GraphService + routes graph
3. **Mirochill** - GraphView avec react-force-graph
4. **Theo** - Extraction entites + web search integration

### Sprint 3 - Polish
1. **Glamgar** - Dark mode + animations + responsive
2. **Nixou** - Cache Redis + optimisations queries
3. **Mirochill** - GraphSidebar + interactions graph
4. **Theo** - BullMQ jobs + enrichissement auto

---

## Communication

- Ping dans le channel dev si bloque
- PR reviews entre vous
- Daily standup rapide (5min max)

---

## Liens Utiles

| Doc | Lien |
|-----|------|
| Vercel AI SDK | https://sdk.vercel.ai/docs |
| Hono | https://hono.dev |
| Prisma | https://prisma.io/docs |
| react-force-graph | https://github.com/vasturiano/react-force-graph |
| Tailwind | https://tailwindcss.com/docs |

---

Let's go!
