# 🗺️ PedIA - Roadmap Complète du Projet

## 📊 Vue d'ensemble

| Phase | Statut | Description |
|-------|--------|-------------|
| Phase 1 - MVP Core | ✅ **Complète** | Infrastructure de base, génération AI, UI principale |
| Phase 2 - Search & Graph | 🔶 **Partielle** | Recherche sémantique, graph avancé |
| Phase 3 - Auto-Evolution | 🔶 **Partielle** | Queue workers, enrichissement auto |
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

## Phase 2 - Search & Graph 🔶 EN COURS

**Objectif** : Recherche sémantique et visualisation avancée

### ✅ Fait
- [x] GraphView avec react-force-graph (2D)
- [x] Page `/explore` pour graph complet
- [x] GraphControls (zoom +/-, reset, filtres par type)
- [x] Hook `useGraph` avec SWR pattern
- [x] Graph local centré sur une page (`/explore?page={id}`)
- [x] Couleurs par type d'entité
- [x] Click sur nœud → navigation vers wiki

### ❌ À faire
- [ ] **Embeddings pgvector** : Implémenter la génération et stockage des embeddings
- [ ] **Service Embedding** : Créer `EmbeddingService` pour chunk/embed/store
- [ ] **API embedding** : Endpoint pour générer embeddings (OpenAI text-embedding-3-small)
- [ ] **Recherche sémantique** : Modifier `/api/search` pour utiliser vector similarity
- [ ] **Migration Qdrant** (optionnel) : Si pgvector insuffisant, migrer vers Qdrant Cloud
- [ ] **Wikidata linking** : Lier entités à leurs QID Wikidata
- [ ] **Minimap graph** : Vue d'ensemble dans le coin (optionnel)
- [ ] **Graph 3D** (optionnel) : react-force-graph-3d

---

## Phase 3 - Auto-Evolution 🔶 EN COURS

**Objectif** : Enrichissement automatique et graph de connaissances vivant

### ✅ Fait
- [x] BullMQ setup (3 queues: extract, link, enrich)
- [x] ExtractWorker : Extraction entités AI + fallback regex
- [x] LinkWorker : Déduplication + création relations entre entités co-occurrentes
- [x] EnrichWorker : Génération pages pour entités importantes (PERSON, ORG, LOCATION, EVENT)
- [x] Pipeline automatique : Page créée → Extract → Link → Enrich → (loop)
- [x] Priorités des queues (extract: 10, link: 8, enrich: 5)

### ❌ À faire
- [ ] **Détection liens bidirectionnels** : Si page A mentionne B, vérifier que B mentionne A
- [ ] **Worker verify** : Vérification périodique des liens existants
- [ ] **Missing link detection** : Algorithme de prédiction (si A et B co-mentionnés souvent...)
- [x] **Queue dashboard** (Bull Board) : UI pour surveiller les queues
- [ ] **Rate limiting enrichissement** : Éviter génération excessive
- [ ] **Neo4j migration** (Phase 3+) : Quand graph > 10k nodes

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

| Priorité | Tâche | Effort estimé |
|----------|-------|---------------|
| P0 | Implémenter embeddings + recherche sémantique | ~4h |
| ~~P0~~ | ~~Dashboard Bull Board pour monitorer les queues~~ | ✅ Fait |
| P1 | Détection liens bidirectionnels manquants | ~2h |
| P1 | Panel sources avec liens sur pages wiki | ~2h |
| P2 | Score de confiance visible | ~1h |
| P2 | Bouton "Signaler un problème" | ~1h |
| P3 | Auth (Clerk recommandé) | ~3h |
| P3 | Tests E2E flow principal | ~3h |

---

## 📁 Fichiers Clés à Créer

```
backend/src/services/embedding.service.ts    # Service embeddings
backend/src/lib/qdrant.ts                    # Client Qdrant (si migration)
backend/src/queue/workers/verifyWorker.ts   # Worker vérification liens
frontend/components/wiki/SourcesPanel.tsx   # Affichage sources
frontend/components/wiki/ReportButton.tsx   # Signalement
frontend/app/admin/queues/page.tsx          # Dashboard Bull Board
```

---

## 📈 Progression Globale

```
Phase 1 ████████████████████ 100%
Phase 2 ████████████░░░░░░░░  60%
Phase 3 ██████████████░░░░░░  70%
Phase 4 ░░░░░░░░░░░░░░░░░░░░   0%
Phase 5 ░░░░░░░░░░░░░░░░░░░░   0%
Phase 6 ░░░░░░░░░░░░░░░░░░░░   0%

Total   ████████░░░░░░░░░░░░  38%
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

*Dernière mise à jour : Janvier 2026*
