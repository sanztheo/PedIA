# 🗺️ PedIA - Roadmap Complète du Projet

## 📊 Vue d'ensemble

| Phase                          | Statut           | Description                                          |
| ------------------------------ | ---------------- | ---------------------------------------------------- |
| Phase 1 - MVP Core             | ✅ **Complète**  | Infrastructure de base, génération AI, UI principale |
| Phase 2 - Search & Graph       | ✅ **Complète**  | Recherche sémantique, graph avancé                   |
| Phase 3 - Auto-Evolution       | ✅ **Complète**  | Queue workers, enrichissement auto                   |
| Phase 4 - Quality & Trust      | ✅ **Complète**  | Vérification sources, bias detection                 |
| Phase 5 - Edition & Versioning | 🔶 **Partielle** | Édition par zones, historique                        |
| Phase 6 - Production           | ❌ **À faire**   | Auth, monitoring, optimisation                       |

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

### Graph

- [x] GraphView avec react-force-graph (2D)
- [x] Page `/explore` pour graph complet
- [x] GraphControls (zoom +/-, reset, filtres par type)
- [x] Hook `useGraph` avec SWR pattern
- [x] Graph local centré sur une page (`/explore?page={id}`)
- [x] Couleurs par type d'entité
- [x] Click sur nœud → navigation vers wiki
- [x] **Toggle vue Graph/Liste** avec groupement alphabétique

### Embeddings & Search

- [x] **Embeddings pgvector** : Génération et stockage des embeddings
- [x] **Service Embedding** : `EmbeddingService` pour chunk/embed/store
- [x] **API embedding** : Endpoint OpenAI text-embedding-3-small
- [x] **Recherche sémantique** : `/api/search` avec vector similarity
- [x] **Wikidata linking** : Service pour lier entités aux QID Wikidata

### ❌ Optionnel (Future)

- [ ] **Migration Qdrant** : Si pgvector insuffisant
- [ ] **Minimap graph** : Vue d'ensemble dans le coin
- [ ] **Graph 3D** : react-force-graph-3d

---

## Phase 3 - Auto-Evolution ✅ COMPLÈTE

**Objectif** : Enrichissement automatique et graph de connaissances vivant

### Queue Workers

- [x] BullMQ setup (4 queues: extract, link, enrich, verify)
- [x] ExtractWorker : Extraction entités AI + fallback regex
- [x] LinkWorker : Déduplication + création relations
- [x] EnrichWorker : Génération pages pour entités importantes
- [x] VerifyWorker : Vérification liens bidirectionnels
- [x] Pipeline automatique : Page créée → Extract → Link → Enrich → Verify
- [x] Priorités des queues (extract: 10, link: 8, enrich: 5, verify: 3)

### Features

- [x] **Détection liens bidirectionnels** : Si page A mentionne B, vérifier que B mentionne A
- [x] **Worker verify** : Vérification périodique des liens existants
- [x] **Missing link detection** : Création auto des liens manquants
- [x] **Queue dashboard** (Bull Board) : UI pour surveiller les queues
- [x] **Rate limiting enrichissement** : Limiter à 10 jobs/min

### ❌ Optionnel (Future)

- [ ] **Neo4j migration** : Quand graph > 10k nodes

---

## Phase 4 - Quality & Trust ✅ COMPLÈTE

**Objectif** : Neutralité, vérification des sources, détection de biais

### Sources & Vérification

- [x] **Whitelist/Blacklist domaines** : Liste de sources Tier 1/2/3
- [x] **Cross-reference** : Vérifier claims dans 2+ sources
- [x] **Source reliability tracking** : Score par source dans DB
- [x] **Panel sources** : Afficher toutes les sources utilisées avec liens
- [ ] **Domain authority score** : Age, trafic, HTTPS, structure
- [ ] **Citations systématiques** : Chaque fait cité avec source

### Détection de biais

- [x] **Analyse lexicale** : Détection mots chargés, superlatifs
- [x] **Sujets sensibles flag** : Politique, religion, santé → multi-source obligatoire
- [x] **Confidence score** : Afficher score de confiance par page
- [x] **Bouton "Signaler"** : Feedback utilisateur avec confirmation

### UI Transparence

- [x] **Indicateurs visuels** : Badge confiance (vert/jaune/rouge)
- [x] **Date de génération visible** : Badge "Généré par IA"
- [x] **Breadcrumb navigation** : Navigation hiérarchique
- [x] **Table of Contents** : Sommaire avec scroll spy
- [x] **Share/Copy actions** : Menu actions consolidé
- [x] **Mobile entities sheet** : Sidebar entités sur mobile
- [x] **Page skeleton loading** : État de chargement amélioré

---

## Phase 5 - Edition & Versioning 🔶 EN COURS

**Objectif** : Modification granulaire et historique des pages

### AI Markdown Editing

- [x] **Parser AST** : Markdown → sections indexées (remark/unified)
- [x] **Section IDs** : Chaque section avec ID unique (`section_2_1`)
- [x] **Tool edit_section** : Remplacer contenu d'une section
- [x] **Tool insert_after** : Insérer après une section
- [x] **Tool append_to_section** : Ajouter à la fin d'une section
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

### Pages Statiques

- [x] **Page About** : Présentation du projet

---

## 🎯 Prochaines Étapes Recommandées

| Priorité | Tâche                                       | Effort estimé |
| -------- | ------------------------------------------- | ------------- |
| P1       | Streaming modifications (highlight édition) | ~2h           |
| P1       | UI historique versions                      | ~2h           |
| P2       | Diff view pour versions                     | ~2h           |
| P2       | Auth (Clerk recommandé)                     | ~3h           |
| P2       | Domain authority score                      | ~2h           |
| P3       | Citations systématiques                     | ~3h           |
| P3       | Tests E2E flow principal                    | ~3h           |
| P3       | Error tracking (Sentry)                     | ~1h           |

---

## 📈 Progression Globale

```
Phase 1 ████████████████████ 100%
Phase 2 ████████████████████ 100%
Phase 3 ████████████████████ 100%
Phase 4 ████████████████████ 100%
Phase 5 ██████████░░░░░░░░░░  50%
Phase 6 ██░░░░░░░░░░░░░░░░░░  10%

Total   ██████████████████░░  77%
```

---

## 📚 Documentation Associée

| Document                               | Description                 |
| -------------------------------------- | --------------------------- |
| `docs/architecture/overview.md`        | Vue d'ensemble architecture |
| `docs/architecture/backend.md`         | API Hono, services          |
| `docs/architecture/frontend.md`        | Next.js, composants         |
| `docs/architecture/database.md`        | PostgreSQL, Qdrant, Redis   |
| `docs/features/streaming-ui.md`        | SSE streaming               |
| `docs/features/graph-visualization.md` | Graph Obsidian-style        |
| `docs/features/entity-extraction.md`   | NER, knowledge graph        |
| `docs/features/ai-markdown-editing.md` | Édition par zones           |
| `docs/research/source-verification.md` | Neutralité, bias detection  |

---

_Dernière mise à jour : 9 Février 2026_
