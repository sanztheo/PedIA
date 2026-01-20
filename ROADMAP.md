# 🗺️ PedIA - Roadmap Complète du Projet

## 📊 Vue d'ensemble

| Phase | Statut | Description |
|-------|--------|-------------|
| Phase 1 - MVP Core | ✅ **Complète** | Infrastructure de base, génération AI, UI principale |
| Phase 2 - Search & Graph | ✅ **Complète** | Recherche sémantique, graph avancé |
| Phase 3 - Auto-Evolution | ✅ **Complète** | Queue workers, enrichissement auto |
| Phase 4 - Quality & Trust | ❌ **À faire** | Vérification sources, bias detection |
| Phase 5 - Edition & Versioning | ❌ **À faire** | Édition par zones, historique |
| Phase 6 - Production | ❌ **À faire** | Auth, monitoring, optimisation |

---

## Phase 1 - MVP Core ✅ COMPLÈTE

**Objectif** : Infrastructure de base fonctionnelle

### Backend
- [x] Setup Hono backend TypeScript
- [x] Schéma Prisma complet (Pages, Entities, Relations, Sources, Embeddings)
- [x] Intégration Redis (cache + queues)
- [x] Agent AI multi-provider (Gemini/OpenAI/Claude via Vercel AI SDK)
- [x] Tool web search (Tavily)
- [x] Tool entity extraction (AI + regex fallback)
- [x] Route `/api/generate` avec streaming SSE
- [x] Routes CRUD pages (`/api/pages`)
- [x] Routes graph (`/api/graph`, `/api/graph/local/:pageId`)
- [x] Route search (`/api/search` - full-text Prisma)

### Frontend
- [x] Setup Next.js 15 (App Router) + Tailwind
- [x] Homepage avec SearchBar
- [x] Page `/search` avec GenerationProgress
- [x] Page `/wiki/[slug]` avec SSR
- [x] MarkdownContent avec syntaxe `[[Entity]]`
- [x] EntitySidebar avec badges colorés
- [x] PageHeader avec métadonnées
- [x] Layout: MainLayout, Header, Sidebar
- [x] Composants UI (shadcn: Button, Input, Sheet)

---

## Phase 2 - Search & Graph ✅ COMPLÈTE

**Objectif** : Recherche sémantique et visualisation avancée

### ✅ Fait
- [x] GraphView avec react-force-graph (2D)
- [x] Page `/explore` pour graph complet
- [x] GraphControls (zoom +/-, reset, filtres par type)
- [x] Hook `useGraph` avec SWR pattern
- [x] Graph local centré sur une page (`/explore?page={id}`)
- [x] Couleurs par type d'entité
- [x] Click sur nœud → navigation vers wiki
- [x] **Embeddings pgvector** : Migration SQL + colonne vector(1536) + index HNSW
- [x] **Service Embedding** : `EmbeddingService` avec chunking markdown (800 tokens), génération OpenAI text-embedding-3-small
- [x] **Recherche sémantique** : Endpoint `/api/search/semantic` avec hybrid search RRF (vector + full-text)
- [x] **Worker embedding** : `embedWorker` BullMQ pour génération async des embeddings

### ❌ À faire (optionnel)
- [ ] **Migration Qdrant** : Si pgvector insuffisant à grande échelle
- [ ] **Wikidata linking** : Lier entités à leurs QID Wikidata
- [ ] **Minimap graph** : Vue d'ensemble dans le coin
- [ ] **Graph 3D** : react-force-graph-3d

---

## Phase 3 - Auto-Evolution ✅ COMPLÈTE

**Objectif** : Enrichissement automatique et graph de connaissances vivant

### ✅ Fait
- [x] BullMQ setup (5 queues: extract, link, enrich, verify, embed)
- [x] ExtractWorker : Extraction entités AI + fallback regex
- [x] LinkWorker : Déduplication + création relations entre entités co-occurrentes
- [x] EnrichWorker : Génération pages pour entités importantes (PERSON, ORG, LOCATION, EVENT)
- [x] EmbedWorker : Génération embeddings async pour recherche sémantique
- [x] VerifyWorker : Vérification périodique des liens existants
- [x] Pipeline automatique : Page créée → Extract → Link → Enrich + Embed → (loop)
- [x] Détection liens bidirectionnels : Si page A mentionne B, vérifier que B mentionne A
- [x] Missing link detection : Algorithme de prédiction (si A et B co-mentionnés souvent...)
- [x] Queue dashboard (Bull Board) : UI pour surveiller les queues `/admin/queues`
- [x] Rate limiting enrichissement : Éviter génération excessive (env: ENRICH_RATE_LIMIT)

### ❌ À faire (optionnel)
- [ ] **Neo4j migration** : Quand graph > 10k nodes

---

## Phase 4 - Quality & Trust ❌ À FAIRE

**Objectif** : Neutralité, vérification des sources, détection de biais

### Sources & Vérification
- [ ] **Whitelist/Blacklist domaines** : Liste de sources Tier 1/2/3
- [ ] **Domain authority score** : Age, trafic, HTTPS, structure
- [ ] **Cross-reference** : Vérifier claims dans 2+ sources
- [ ] **Source reliability tracking** : Score par source dans DB
- [ ] **Citations systématiques** : Chaque fait cité avec source

### Détection de biais
- [ ] **Analyse lexicale** : Détection mots chargés, superlatifs
- [ ] **Sujets sensibles flag** : Politique, religion, santé → multi-source obligatoire
- [ ] **Confidence score** : Afficher score de confiance par page
- [ ] **Bouton "Signaler"** : Feedback utilisateur

### UI Transparence
- [ ] **Panel sources** : Afficher toutes les sources utilisées avec liens
- [ ] **Indicateurs visuels** : Badge confiance (vert/jaune/rouge)
- [ ] **Date de génération visible**

---

## Phase 5 - Edition & Versioning ❌ À FAIRE

**Objectif** : Modification granulaire et historique des pages

### AI Markdown Editing
- [ ] **Parser AST** : Markdown → sections indexées (remark/unified)
- [ ] **Section IDs** : Chaque section avec ID unique (`section_2_1`)
- [ ] **Tool edit_section** : Remplacer contenu d'une section
- [ ] **Tool insert_after** : Insérer après une section
- [ ] **Tool append_to_section** : Ajouter à la fin d'une section
- [ ] **Streaming modifications** : Highlight section en cours d'édition

### Versioning
- [ ] **UI historique** : Liste des versions (schéma `PageVersion` existe)
- [ ] **Diff view** : Comparaison avant/après
- [ ] **Rollback** : Revenir à une version antérieure
- [ ] **Changelog auto** : Résumé des modifications

### Éditeur (optionnel)
- [ ] **Tiptap integration** : Éditeur markdown WYSIWYG
- [ ] **Mode source** : Monaco pour édition raw

---

## Phase 6 - Production ❌ À FAIRE

**Objectif** : Sécurité, performance, monitoring

### Authentification
- [ ] **Choisir provider** : Clerk vs Auth.js vs Custom
- [ ] **Rôles** : Admin, Moderator, User
- [ ] **Rate limiting** : Par utilisateur/IP

### Monitoring & Analytics
- [ ] **Error tracking** : Sentry ou Highlight
- [ ] **Analytics** : Plausible ou PostHog
- [ ] **Dashboard métriques** : Temps génération, taux erreur, pages/jour
- [ ] **Alertes** : Latence anormale, erreurs

### Performance
- [ ] **CDN images** : Cloudflare ou Vercel
- [ ] **Optimisation mobile** : Animations réduites, max 500 nodes graph
- [ ] **Lazy loading** : Composants lourds (GraphView)
- [ ] **Web Workers** : Calcul physique graph dans worker séparé

### API & Documentation
- [ ] **API publique** : Endpoints documentés
- [ ] **OpenAPI spec** : Documentation auto-générée
- [ ] **Rate limiting API**

### Tests
- [ ] **Tests E2E** : Playwright ou Cypress
- [ ] **Tests unitaires** : Services backend
- [ ] **CI/CD** : GitHub Actions

---

## 🎯 Prochaines Étapes Recommandées

| Priorité | Tâche | Statut |
|----------|-------|--------|
| ~~P0~~ | ~~Implémenter embeddings + recherche sémantique~~ | ✅ Fait |
| ~~P0~~ | ~~Dashboard Bull Board pour monitorer les queues~~ | ✅ Fait |
| ~~P1~~ | ~~Détection liens bidirectionnels manquants~~ | ✅ Fait |
| P1 | Panel sources avec liens sur pages wiki | À faire |
| P2 | Score de confiance visible | À faire |
| P2 | Bouton "Signaler un problème" | À faire |
| P3 | Auth (Clerk recommandé) | À faire |
| P3 | Tests E2E flow principal | À faire |

---

## 📁 Fichiers Clés

### ✅ Créés
```
backend/src/services/embedding.service.ts    # Service embeddings (chunking, OpenAI, pgvector, hybrid search)
backend/src/queue/workers/embedWorker.ts     # Worker génération embeddings
backend/src/queue/workers/verifyWorker.ts    # Worker vérification liens
backend/prisma/migrations/0_init_pgvector.sql # Migration pgvector + index HNSW
```

### ❌ À créer
```
backend/src/lib/qdrant.ts                    # Client Qdrant (si migration)
frontend/components/wiki/SourcesPanel.tsx    # Affichage sources
frontend/components/wiki/ReportButton.tsx    # Signalement
```

---

## 📈 Progression Globale

```
Phase 1 ████████████████████ 100%
Phase 2 ████████████████████ 100%
Phase 3 ████████████████████ 100%
Phase 4 ░░░░░░░░░░░░░░░░░░░░   0%
Phase 5 ░░░░░░░░░░░░░░░░░░░░   0%
Phase 6 ░░░░░░░░░░░░░░░░░░░░   0%

Total   ██████████░░░░░░░░░░  50%
```

---

## 📚 Documentation Associée

| Document | Description |
|----------|-------------|
| `docs/architecture/overview.md` | Vue d'ensemble architecture |
| `docs/architecture/backend.md` | API Hono, services |
| `docs/architecture/frontend.md` | Next.js, composants |
| `docs/architecture/database.md` | PostgreSQL, Qdrant, Redis |
| `docs/features/streaming-ui.md` | SSE streaming |
| `docs/features/graph-visualization.md` | Graph Obsidian-style |
| `docs/features/entity-extraction.md` | NER, knowledge graph |
| `docs/features/ai-markdown-editing.md` | Édition par zones |
| `docs/research/source-verification.md` | Neutralité, bias detection |

---

*Dernière mise à jour : 20 Janvier 2026*
