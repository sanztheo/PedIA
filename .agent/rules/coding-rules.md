---
trigger: always_on
---

# PedIA - Règles Obligatoires du Projet

> **Ce document doit être lu et respecté AVANT toute modification du projet.**

---

## 📖 Documentation de Référence Officielle

| Technologie   | Documentation Officielle                             | Version           |
| ------------- | ---------------------------------------------------- | ----------------- |
| Next.js 15    | [nextjs.org/docs](https://nextjs.org/docs)           | 15.x (App Router) |
| Hono          | [hono.dev](https://hono.dev)                         | Latest            |
| Vercel AI SDK | [ai-sdk.dev](https://ai-sdk.dev)                     | v6                |
| Prisma        | [prisma.io/docs](https://prisma.io/docs)             | Latest            |
| BullMQ        | [docs.bullmq.io](https://docs.bullmq.io)             | Latest            |
| Tailwind CSS  | [tailwindcss.com/docs](https://tailwindcss.com/docs) | v3                |
| shadcn/ui     | [ui.shadcn.com](https://ui.shadcn.com)               | Latest            |

---

## ✅ DO - Règles Obligatoires

### Avant de Coder

1. **Lire les fichiers de contexte**
   - `.cursorrules` / `CLAUDE.md` / `.windsurfrules` - Règles AI
   - `docs/architecture/` - Architecture technique
   - fichier de tâche spécifique si applicable

2. **Explorer le codebase existant**
   - Chercher des patterns similaires dans le code
   - Vérifier `docs/` pour les spécifications
   - Identifier les fichiers à modifier/créer

3. **Demander clarification si incertitude**
   - Ne pas deviner l'intention du user
   - Poser des questions précises

### Pendant le Code

4. **Suivre les patterns existants**
   - Copier le style du code environnant
   - Utiliser les mêmes conventions de nommage
   - Respecter la structure des fichiers

5. **Rester dans le scope**
   - Implémenter uniquement ce qui est demandé
   - Pas de refactoring non sollicité
   - Pas de features bonus sans validation

6. **Nommer clairement**
   - Noms clairs > commentaires
   - Variables/fonctions descriptives
   - Pas de commentaires évidents

### Après le Code

7. **Tester systématiquement**

   ```bash
   # Frontend
   npm run lint && npm run build

   # Backend
   npm run typecheck && npm run lint
   ```

8. **Commits propres**
   - Une ligne, max 50 caractères
   - Format: `fix:` | `feat:` | `update:` | `refactor:`
   - **JAMAIS de "Co-Authored-By" ou signatures AI**

---

## ❌ DON'T - À Éviter Absolument

### Code

| ❌ Interdit                 | ✅ Alternative       |
| --------------------------- | -------------------- |
| Commentaires inutiles       | Code auto-documenté  |
| `console.log` en production | Logger approprié     |
| `any` en TypeScript         | Types stricts        |
| Imports non utilisés        | Nettoyer les imports |
| Code dupliqué               | Extraire en fonction |
| Magic numbers/strings       | Constants nommées    |

### Architecture

| ❌ Interdit                      | ✅ Alternative        |
| -------------------------------- | --------------------- |
| Modifier plusieurs zones         | Une zone par PR       |
| Toucher aux fichiers hors scope  | Demander permission   |
| Changer l'architecture sans plan | Discuter d'abord      |
| Ignorer les tests qui échouent   | Corriger avant commit |

### Zones Protégées (selon contexte)

| Si vous êtes | NE PAS toucher                                            |
| ------------ | --------------------------------------------------------- |
| Frontend     | `backend/src/queue/` (zone Queue)                         |
| Backend      | `frontend/e2e/` (zone Tests)                              |
| Tous         | Fichiers `.env`, `prisma/schema.prisma` (sans validation) |

---

## 🏗️ Conventions de Code

### Frontend (Next.js 15)

```typescript
// ✅ Server Components par défaut (SSR/SEO)
// app/wiki/[slug]/page.tsx
export default async function WikiPage({ params }) {
  const page = await fetchPage(params.slug);
  return <Article {...page} />;
}

// ✅ Client Components uniquement pour interactivité
// components/SearchBar.tsx
'use client';
export function SearchBar() {
  const [query, setQuery] = useState('');
  // ...
}
```

**Règles Frontend:**

- Server Components par défaut
- `'use client'` uniquement si nécessaire (state, events, hooks client)
- SWR pour le data fetching client
- Tailwind pour le styling
- shadcn/ui pour les composants UI

### Backend (Hono)

```typescript
// ✅ Route avec validation Zod
app.post("/api/pages", zValidator("json", createPageSchema), async (c) => {
  const data = c.req.valid("json");
  const page = await pageService.create(data);
  return c.json(page, 201);
});

// ✅ SSE Streaming
app.get("/api/generate", async (c) => {
  return streamSSE(c, async (stream) => {
    await stream.writeSSE({ event: "step_start", data: "..." });
  });
});
```

**Règles Backend:**

- Validation Zod sur tous les inputs
- SSE pour le streaming AI
- BullMQ pour jobs async
- Redis pour le cache (TTL approprié)
- Prisma pour PostgreSQL

### Naming Conventions

| Type               | Convention      | Exemple           |
| ------------------ | --------------- | ----------------- |
| Components         | PascalCase      | `SearchBar.tsx`   |
| Functions/Hooks    | camelCase       | `useGraph()`      |
| Files (components) | PascalCase      | `GraphView.tsx`   |
| Files (utils)      | kebab-case      | `string-utils.ts` |
| DB Tables          | PascalCase      | `PageEntity`      |
| Constantes         | SCREAMING_SNAKE | `MAX_RETRIES`     |

---

## 🔄 Workflows Obligatoires

### EPCT (Feature Implementation)

```
1. EXPLORE
   - Rechercher fichiers pertinents
   - Lire docs/ et patterns existants

2. PLAN
   - Lister fichiers à créer/modifier
   - Demander validation si scope important

3. CODE
   - Suivre patterns existants
   - Rester dans le scope

4. TEST
   - Linter + typecheck
   - Tests unitaires si applicable
```

### Commit Flow

```bash
git add -A
git diff --cached --stat  # Vérifier les changements
git commit -m "feat: add search functionality"  # MAX 50 chars
git push
```

---

## 📁 Structure du Projet

```
PedIA/
├── frontend/                    # Next.js 15
│   ├── src/
│   │   ├── app/                # Pages (App Router)
│   │   ├── components/         # React components
│   │   │   ├── ui/            # shadcn components
│   │   │   ├── layout/        # Header, Sidebar, etc.
│   │   │   ├── wiki/          # Wiki-specific
│   │   │   ├── graph/         # Graph visualization
│   │   │   └── generation/    # AI generation UI
│   │   ├── hooks/             # Custom hooks
│   │   ├── lib/               # Utilities
│   │   ├── services/          # API client
│   │   └── types/             # TypeScript types
├── backend/                    # Hono API
│   ├── src/
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # Business logic
│   │   ├── ai/                # Agent, prompts, tools
│   │   ├── queue/             # BullMQ queues + workers
│   │   ├── lib/               # Prisma, Redis, utils
│   │   └── types/             # TypeScript types
│   ├── prisma/                # DB schema
│   └── tests/                 # Backend tests
└── docs/                       # Documentation
    ├── architecture/          # Système
    ├── features/              # Fonctionnalités
    ├── research/              # Recherches
    └── tasks/                 # Tâches attribuées
```

---

## 🎯 Priorité de Développement

```
Correctness > Completeness > Speed
(Correct avant Complet avant Rapide)
```

---

## 🔐 Sécurité & Bonnes Pratiques

### Variables d'Environnement

- **JAMAIS** de secrets dans le code
- Fichiers `.env` dans `.gitignore`
- Utiliser `process.env.VAR_NAME`

### Gestion des Erreurs

```typescript
// ✅ Bon
try {
  const result = await apiCall();
  return result;
} catch (error) {
  logger.error("Context:", error);
  throw new AppError("User-friendly message", 500);
}

// ❌ Mauvais
const result = await apiCall(); // Pas de try/catch
```

### Rate Limiting

| Endpoint        | Limite  |
| --------------- | ------- |
| `/api/generate` | 10/min  |
| `/api/pages`    | 100/min |
| `/api/graph`    | 50/min  |

---

## 📊 Types d'Entités

```typescript
type EntityType =
  | "PERSON"
  | "ORGANIZATION"
  | "LOCATION"
  | "CONCEPT"
  | "EVENT"
  | "PRODUCT"
  | "WORK"
  | "OTHER";
```

---

## 🚀 Commandes Essentielles

```bash
# Frontend
cd frontend && npm run dev      # Dev server
npm run lint                    # Linting
npm run build                   # Build production

# Backend
cd backend && npm run dev       # Dev server
npm run typecheck              # Type checking
npm run lint                   # Linting

# Tests Backend
node --env-file=.env --import=tsx tests/queue.test.ts

# Prisma
npx prisma generate            # Générer client
npx prisma db push             # Sync schema
```

---

## ⚠️ Checklist Avant PR/Commit

- [ ] Code lint-clean (`npm run lint`)
- [ ] Types valides (`npm run typecheck`)
- [ ] Build réussi (`npm run build`)
- [ ] Tests passent (si applicable)
- [ ] Pas de `console.log` en dur
- [ ] Pas de secrets exposés
- [ ] Commit message < 50 chars
- [ ] Pas de signature AI dans le commit

---

## 📚 Voir Aussi

| Document                             | Contenu                   |
| ------------------------------------ | ------------------------- |
| `docs/architecture/overview.md`      | Vue d'ensemble système    |
| `docs/architecture/frontend.md`      | Patterns Next.js          |
| `docs/architecture/backend.md`       | API Hono, services        |
| `docs/architecture/database.md`      | PostgreSQL, Qdrant, Redis |
| `docs/features/streaming-ui.md`      | SSE streaming             |
| `docs/features/entity-extraction.md` | NER, knowledge graph      |
| `ROADMAP.md`                         | Phases de développement   |

---

/!\ Tu n’as pas le droit de masquer, contourner ou ignorer une erreur.

À chaque bug, warning ou comportement inattendu, tu dois :

Identifier la cause racine réelle (root cause), même si elle se situe en amont dans l’architecture, la configuration, les dépendances ou la logique métier.

Corriger le problème à la source dès que c’est possible, plutôt que d’appliquer un patch, un try/catch abusif, un hack temporaire ou une désactivation silencieuse.

Refuser toute solution qui :

cache une erreur

désactive une règle (lint, type, sécurité) sans justification solide

ajoute de la complexité pour masquer un défaut existant

Garantir que la correction :

ne crée aucun effet de bord

ne dégrade pas la lisibilité

ne génère aucune nouvelle dette technique

Produire un code propre, lisible, maintenable et documenté, conforme aux bonnes pratiques actuelles.

Si une correction définitive n’est pas possible, tu dois :

expliquer précisément pourquoi

proposer la meilleure alternative stable

documenter clairement la limite existante

⚠️ Tu dois toujours privilégier une solution robuste, durable et correcte plutôt qu’une solution rapide ou superficielle

---

RUN LE LINT A CHAQUE FOIS que tu as fini les modifs

_Dernière mise à jour: Janvier 2026_
