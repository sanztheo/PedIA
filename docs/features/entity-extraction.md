# PedIA - Entity Extraction & Knowledge Graph

## Concept

Chaque page generee par PedIA est analysee pour extraire les entites (personnes, organisations, lieux, concepts) qui sont ensuite liees dans un graphe de connaissances.

---

## Types d'Entites

| Type | Description | Exemples |
|------|-------------|----------|
| **PERSON** | Individus | Elon Musk, Marie Curie |
| **ORGANIZATION** | Entreprises, institutions | Tesla, NASA, ONU |
| **LOCATION** | Lieux geographiques | Paris, Mars, Silicon Valley |
| **CONCEPT** | Idees abstraites | Intelligence artificielle, Democratie |
| **EVENT** | Evenements historiques | Revolution francaise, World War II |
| **PRODUCT** | Produits, technologies | iPhone, Model S |
| **WORK** | Oeuvres | Mona Lisa, Harry Potter |

---

## Pipeline d'Extraction

### Etape 1 : Extraction LLM

L'IA analyse le contenu genere et identifie les entites:
- Nom de l'entite
- Type (enum ci-dessus)
- Contexte (phrase ou elle apparait)
- Confiance (0-1)

### Etape 2 : Deduplication

Pour chaque entite extraite:
1. Recherche d'entite existante avec nom similaire
2. Verification du type
3. Si match -> utiliser l'existante
4. Sinon -> creer nouvelle entite

### Etape 3 : Linking Wikidata (Optionnel)

Pour les entites de haute confiance:
1. Query SPARQL Wikidata
2. Recuperer QID (ex: Q937 pour Tesla)
3. Stocker la reference

### Etape 4 : Creation des Relations

Entre entites:
- FOUNDER_OF (Person -> Organization)
- WORKS_AT (Person -> Organization)
- LOCATED_IN (Organization -> Location)
- RELATED_TO (Concept -> Concept)
- etc.

---

## Schema des Relations

### Relations Predefinies

| Relation | De | Vers | Exemple |
|----------|----|----|---------|
| FOUNDER_OF | Person | Organization | Elon Musk -> Tesla |
| CEO_OF | Person | Organization | Tim Cook -> Apple |
| BORN_IN | Person | Location | Einstein -> Ulm |
| HEADQUARTERED_IN | Organization | Location | Google -> Mountain View |
| SUBSIDIARY_OF | Organization | Organization | Instagram -> Meta |
| PART_OF | Concept | Concept | Machine Learning -> AI |
| OCCURRED_IN | Event | Location | D-Day -> Normandy |

### Relations Dynamiques

L'IA peut creer des relations non predefinies:
- Type : description libre
- Bidirectionnel : oui/non
- Temporel : dates de validite

---

## Auto-Evolution

### Detection de Pages Manquantes

Quand une entite est extraite:
1. Verifier si elle a une page dediee
2. Si non -> Queue job de creation
3. Priorite basee sur frequence de mention

### Mise a Jour Bidirectionnelle

Quand la page "SpaceX" est creee:
1. Elle mentionne "Elon Musk"
2. La page "Elon Musk" doit mentionner "SpaceX"
3. Job queue pour verifier et ajouter si manquant

### Detection de Liens Manquants

Algorithme de prediction:
1. Si A et B sont souvent co-mentionnes
2. Et A est lie a C
3. Alors B pourrait etre lie a C
4. Verification par l'IA -> ajout si pertinent

---

## Prompts d'Extraction

### Principes

L'IA doit:
1. Extraire UNIQUEMENT les entites presentes dans le texte
2. Ne pas inventer de relations non explicites
3. Indiquer le niveau de confiance
4. Fournir le contexte exact

### Format de Sortie

Schema JSON structure avec validation Zod/Pydantic:
- Liste d'entites avec attributs
- Liste de relations avec source/target
- Metadonnees (confiance, contexte)

---

## Performance

### Indexation

| Champ | Index |
|-------|-------|
| Entity.name | B-tree + trigram (fuzzy) |
| Entity.type | B-tree |
| Entity.wikidataId | B-tree unique |
| Relation.fromId | B-tree |
| Relation.toId | B-tree |
| Relation.type | B-tree |

### Cache

- Entites frequentes en Redis
- Invalidation sur modification
- TTL 1 heure

### Queue Priority

| Job | Priorite | Description |
|-----|----------|-------------|
| Extract | 10 | Extraction immediate apres generation |
| Link | 8 | Deduplication et Wikidata linking |
| Enrich | 5 | Creation pages manquantes |
| Verify | 3 | Verification liens existants |

---

## Neo4j Integration (Phase 2)

### Pourquoi Neo4j ?

PostgreSQL suffit pour le MVP, mais Neo4j excelle quand:
- Graph > 10,000 nodes
- Requetes de traversal complexes
- Shortest path, patterns

### Migration

1. Export des relations PostgreSQL
2. Import dans Neo4j
3. Dual-write pendant transition
4. Switch complet

### Requetes Typiques

- "Tous les fondateurs d'entreprises tech"
- "Chemin le plus court entre Einstein et Tesla"
- "Entites liees a moins de 3 hops"

---

## Verification des Sources

### Principes

Chaque entite extraite doit:
1. Etre verifiable dans les sources
2. Avoir une confiance > 0.8 pour creation automatique
3. Etre flaguee pour review si confiance < 0.8

### Cross-Reference

Pour les faits importants:
1. Verifier dans 2+ sources independantes
2. Comparer les dates, chiffres
3. Signaler les contradictions

---

## Metriques

### KPIs

| Metrique | Cible |
|----------|-------|
| Precision extraction | > 95% |
| Recall entites | > 90% |
| Deduplication accuracy | > 98% |
| Wikidata link rate | > 70% |

### Monitoring

- Dashboard temps reel des extractions
- Alertes sur anomalies (trop/peu d'entites)
- Review queue pour cas ambigus

---

## Voir Aussi

- [Backend Architecture](../architecture/backend.md)
- [Database Design](../architecture/database.md)
- [AI Markdown Editing](./ai-markdown-editing.md)
