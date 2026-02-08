# THEO - Embedding & Recherche Semantique

## Mission

Implementer la recherche semantique avec pgvector. Les utilisateurs doivent pouvoir trouver des pages par sens, pas seulement par mots-cles exacts.

---

## Pourquoi

Actuellement `/api/search` fait du full-text basique. Rechercher "vehicule electrique" ne trouve pas "Tesla". Avec les embeddings, ca marchera.

---

## Fichiers a Creer

| Fichier | Action |
|---------|--------|
| `backend/src/services/embedding.service.ts` | CREER |
| `backend/src/routes/embeddings.ts` | CREER |
| `backend/prisma/migrations/xxx_pgvector.sql` | CREER |

## Fichiers a Modifier

| Fichier | Action |
|---------|--------|
| `backend/prisma/schema.prisma` | Activer pgvector sur model Embedding |
| `backend/src/routes/search.ts` | Ajouter mode semantic |
| `backend/src/app.ts` | Ajouter route embeddings |

---

## Direction Technique

### 1. EmbeddingService

Creer un service avec ces responsabilites :
- Decouper le contenu markdown en chunks (~500 tokens)
- Appeler OpenAI `text-embedding-3-small` pour generer les vecteurs
- Stocker les vecteurs dans PostgreSQL via pgvector
- Rechercher par similarite cosinus

**Methodes a implementer** :
- `chunkContent(markdown)` - splitter par sections ou paragraphes
- `generateEmbedding(text)` - appel OpenAI
- `embedPage(pageId)` - orchestrer tout le flow
- `searchSimilar(query, limit)` - recherche vectorielle

### 2. Migration pgvector

Ecrire une migration SQL manuelle :
- Activer l'extension pgvector
- Ajouter colonne vector(1536) sur table Embedding
- Creer index pour performances (IVFFlat ou HNSW)

**Rechercher** : syntaxe exacte pgvector + Prisma raw queries

### 3. Route /api/embeddings

- `POST /api/embeddings/generate/:pageId` - trigger embedding
- `GET /api/embeddings/status/:pageId` - verifier si embeddings existent

### 4. Modifier /api/search

Ajouter query param `?mode=semantic` :
- `keyword` (defaut) : comportement actuel
- `semantic` : utiliser embeddings
- `hybrid` (bonus) : combiner les deux

---

## Flow

```
Page creee
    |
    v
Chunker markdown (par ##)
    |
    v
Pour chaque chunk -> OpenAI embedding
    |
    v
Stocker dans Embedding table
    |
    v
Index pgvector pour recherche rapide
```

---

## Criteres de Succes

- [ ] Migration pgvector OK
- [ ] Une page peut etre embedee
- [ ] Recherche semantic retourne des resultats
- [ ] "vehicule electrique" trouve "Tesla"
- [ ] Performance < 200ms

---

## Tests

```bash
npm run typecheck
node --env-file=.env --import=tsx tests/embedding.test.ts
```

---

## Ressources

- pgvector : https://github.com/pgvector/pgvector
- OpenAI Embeddings : https://platform.openai.com/docs/guides/embeddings
- Vercel AI SDK embeddings : https://sdk.vercel.ai/docs/ai-sdk-core/embeddings

---

## Ne Pas Toucher

- `backend/src/queue/` (zone Nixou)
- `frontend/components/wiki/` (zone Glamgar)
- `frontend/e2e/` (zone Kofu)
