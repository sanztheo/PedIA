# PedIA - Database Design

## Overview

Architecture multi-database optimisee:

| Database | Role | Phase |
|----------|------|-------|
| PostgreSQL | Pages, entities, relations | MVP |
| Qdrant | Embeddings vectoriels | MVP |
| Redis | Cache, queues | MVP |
| Neo4j | Graph complet | Phase 2 |

---

## PostgreSQL Schema

### Tables Principales

#### Page

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Primary key |
| slug | VARCHAR | URL-friendly, unique |
| title | VARCHAR | Titre de la page |
| content | TEXT | Contenu markdown |
| summary | VARCHAR(500) | Resume court |
| sources | TEXT[] | URLs des sources |
| viewCount | INT | Compteur de vues |
| isComplete | BOOLEAN | Page complete ou partielle |
| confidence | FLOAT | Score de confiance sources |
| createdAt | TIMESTAMP | Date creation |
| updatedAt | TIMESTAMP | Date modification |

#### Entity

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR | Nom de l'entite |
| slug | VARCHAR | URL-friendly, unique |
| type | ENUM | PERSON, ORG, LOCATION, etc. |
| description | TEXT | Description courte |
| wikidataId | VARCHAR | QID Wikidata (optionnel) |
| imageUrl | VARCHAR | URL image (optionnel) |
| createdAt | TIMESTAMP | Date creation |
| updatedAt | TIMESTAMP | Date modification |

#### PageEntity (Junction)

| Colonne | Type | Description |
|---------|------|-------------|
| pageId | UUID | FK vers Page |
| entityId | UUID | FK vers Entity |
| context | TEXT | Phrase ou l'entite apparait |
| position | INT | Position dans le document |

#### EntityRelation

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Primary key |
| fromId | UUID | FK vers Entity (source) |
| toId | UUID | FK vers Entity (target) |
| type | VARCHAR | FOUNDER_OF, LOCATED_IN, etc. |
| properties | JSONB | Metadata additionnelle |
| confidence | FLOAT | Score de confiance |
| validFrom | TIMESTAMP | Debut de validite |
| validTo | TIMESTAMP | Fin de validite (null = actuel) |
| createdAt | TIMESTAMP | Date creation |

### Types Enum

**EntityType** : PERSON, ORGANIZATION, LOCATION, CONCEPT, EVENT, PRODUCT, WORK, OTHER

---

## Indexes

### Performance Critiques

| Table | Colonne(s) | Type | Raison |
|-------|------------|------|--------|
| Page | slug | B-tree unique | Lookup rapide |
| Page | title | GIN (trigram) | Full-text search |
| Page | createdAt | B-tree DESC | Tri chronologique |
| Entity | name | B-tree + trigram | Recherche fuzzy |
| Entity | type | B-tree | Filtrage |
| Entity | wikidataId | B-tree unique | Lookup externe |
| EntityRelation | fromId | B-tree | Traversal |
| EntityRelation | toId | B-tree | Traversal inverse |
| EntityRelation | type | B-tree | Filtrage relations |

---

## Qdrant (Vector DB)

### Collection : page_chunks

| Champ | Type | Description |
|-------|------|-------------|
| id | STRING | `{pageId}_{chunkIndex}` |
| vector | FLOAT[1536] | Embedding (ada-002) |
| payload.pageId | STRING | Reference vers Page |
| payload.chunkIndex | INT | Index du chunk |
| payload.text | STRING | Texte du chunk |
| payload.sectionId | STRING | Section d'origine |
| payload.entityIds | STRING[] | Entites dans le chunk |

### Configuration

- **Distance** : Cosine similarity
- **Chunk size** : ~500 tokens
- **Overlap** : 50 tokens

### Operations

| Operation | Usage |
|-----------|-------|
| Upsert | Indexation nouvelle page |
| Search | Recherche semantique |
| Delete | Suppression page |
| Filter | Filtrer par entityIds |

---

## Redis

### Patterns de Cles

| Pattern | TTL | Contenu |
|---------|-----|---------|
| `page:{slug}` | 3600s | Page JSON |
| `search:{hash}` | 900s | Resultats recherche |
| `graph:{pageId}:{depth}` | 1800s | Graph local JSON |
| `entity:{id}` | 3600s | Entity JSON |
| `recent_pages` | - | List (LPUSH/LTRIM) |

### Queues BullMQ

| Queue | Usage |
|-------|-------|
| extract | Jobs extraction entites |
| link | Jobs linking/dedup |
| enrich | Jobs enrichissement |
| verify | Jobs verification |

---

## Neo4j (Phase 2)

### Quand Migrer ?

| Critere | Seuil |
|---------|-------|
| Nombre de nodes | > 10,000 |
| Requetes traversal | Frequentes |
| Profondeur traversal | > 3 hops |
| Analytics graph | Requises |

### Node Labels

| Label | Properties |
|-------|------------|
| Person | id, name, slug, birthDate, deathDate |
| Organization | id, name, slug, foundedDate |
| Location | id, name, slug, coordinates |
| Concept | id, name, slug |
| Page | id, slug, title, createdAt |

### Relationship Types

| Type | De | Vers |
|------|----|----|
| FOUNDED | Person | Organization |
| WORKS_AT | Person | Organization |
| BORN_IN | Person | Location |
| LOCATED_IN | Organization | Location |
| SUBSIDIARY_OF | Organization | Organization |
| MENTIONS | Page | Entity |
| LINKS_TO | Page | Page |

### Cas d'Usage

- Shortest path entre entites
- Patterns de co-occurrence
- Clustering communities
- Recommendation liens manquants

---

## Data Flow

### Creation de Page

```
1. User search "Tesla"
2. Check cache Redis -> miss
3. Check PostgreSQL -> not found
4. Generate with AI
5. Save Page to PostgreSQL
6. Extract entities
7. Save/update Entities
8. Create PageEntity links
9. Create EntityRelations
10. Index chunks in Qdrant
11. Cache in Redis
12. Queue enrichment jobs
```

### Recherche

```
1. User query
2. Check Redis cache
3. If miss:
   a. Semantic search Qdrant (top 20)
   b. Full-text PostgreSQL
   c. Merge & rank
   d. Cache result
4. Return results
```

---

## Backup Strategy

### PostgreSQL

- **Frequence** : Daily full + continuous WAL
- **Retention** : 30 jours
- **Point-in-time** : Oui

### Qdrant

- **Frequence** : Daily snapshots
- **Retention** : 7 jours

### Redis

- **RDB** : Toutes les 15 min si changes
- **AOF** : Toutes les secondes
- **Note** : Reconstructible depuis PostgreSQL

---

## Voir Aussi

- [Architecture Overview](./overview.md)
- [Backend Architecture](./backend.md)
- [Entity Extraction](../features/entity-extraction.md)
