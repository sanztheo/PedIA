# PedIA - Web Search APIs Research

## Objectif

PedIA necessite une recherche web fiable pour sourcer le contenu genere. Cette recherche compare les options disponibles.

---

## Comparatif des APIs

### APIs de Recherche

| Provider | Prix | Limite | Qualite | Use Case |
|----------|------|--------|---------|----------|
| **Tavily** | $0.008/credit | 1,000/jour free | Excellent | AI-native, recommande |
| **Bright Data** | $0.0015/result | Illimite | Excellent | Enterprise, multi-moteurs |
| **SerpAPI** | $75-275/mois | 100 free | Tres bon | 80+ moteurs |
| **Serper** | $50+/mois | 50,000/mois | Bon | Budget, rapide |
| **DataForSEO** | $0.0006/SERP | 2,000/min | Bon | Volume eleve |

### Recommandation pour PedIA

**Phase MVP** : Tavily
- API optimisee pour AI/LLM
- 1,000 credits gratuits/mois pour tester
- Agregation de 20+ sources automatique
- Reponses rapides

**Phase Production** : Bright Data ou SerpAPI
- Multi-moteurs pour diversite
- Meilleure couverture internationale
- Moins cher a grande echelle

---

## Outils de Scraping

### Comparatif

| Outil | Rendu JS | Performance | Prix |
|-------|----------|-------------|------|
| **Jina AI Reader** | Limite | Rapide | Free tier genereux |
| **Firecrawl** | Excellent | Moyen | Subscription |
| **Puppeteer** | Complet | Lent | Open source |
| **Playwright** | Complet | Moyen | Open source |
| **Cheerio** | Aucun | Tres rapide | Open source |

### Strategie Recommandee

1. **Premier essai** : Jina AI Reader (rapide, gratuit)
2. **Fallback JS** : Firecrawl (sites dynamiques React/Vue)
3. **Cas speciaux** : Playwright (interactions complexes)

### Decision Tree

```
Site static (HTML simple) ?
  -> Cheerio ou Jina AI
Site avec JavaScript ?
  -> Jina AI (premier essai)
  -> Si echec -> Firecrawl
Site avec anti-bot ?
  -> Bright Data (proxies residentiels)
```

---

## Verification des Sources

### Probleme

Les LLMs ont des biais dans l'evaluation de credibilite:
- Tendance a classer certains domaines comme "peu fiables"
- Confusion entre presentation et credibilite
- Fabrication de citations (39% sans internet)

### Solution pour PedIA

1. **Multi-source** : Minimum 3 sources independantes
2. **Domain check** : Liste blanche de sources fiables
3. **Cross-reference** : Verification croisee des faits
4. **Human flag** : Sources controversees marquees pour review

### Framework CRAAP

Criteres d'evaluation (automatisables partiellement):

| Critere | Question | Automatisable |
|---------|----------|---------------|
| Currency | Date de publication recente ? | Oui |
| Relevance | Couvre le sujet ? | Partiellement |
| Authority | Auteur/source credible ? | Partiellement |
| Accuracy | Factuel, avec sources ? | Difficile |
| Purpose | Objectif informatif ? | Difficile |

---

## Gestion du Cache

### Strategie

| Type de contenu | TTL | Raison |
|-----------------|-----|--------|
| Articles news | 1 heure | Actualite |
| Pages Wikipedia | 24 heures | Stabilite |
| Sites corporate | 1 semaine | Peu de changements |
| Donnees temps reel | 5 minutes | Fraicheur critique |

### Implementation

- Redis pour cache chaud
- Hash de l'URL comme cle
- Invalidation sur nouvelle recherche similaire

---

## Rate Limiting

### Bonnes Pratiques

| Strategie | Description |
|-----------|-------------|
| Backoff exponentiel | 1s, 2s, 4s, 8s... entre retries |
| Per-domain limits | Max 2-5 requetes/seconde/domaine |
| Robots.txt | Toujours respecter |
| User-Agent | Identifier clairement comme bot |

### Gestion des Erreurs

| Code | Action |
|------|--------|
| 429 | Backoff + retry |
| 403 | Skip, marquer domaine |
| 503 | Retry apres delai |
| Timeout | Retry avec timeout augmente |

---

## Considerations Legales

### Autorise

- Scraping de donnees publiques
- Respect des robots.txt
- Usage recherche/education
- Caching raisonnable

### Interdit

- Contournement de paywalls
- Scraping de donnees personnelles
- Violation des Terms of Service
- Republication sans attribution

### Recommandations PedIA

1. Toujours citer les sources
2. Ne pas stocker le contenu brut
3. Respecter les robots.txt
4. Limiter la frequence de scraping
5. Permettre l'opt-out pour les editeurs

---

## Architecture Recommandee

### Flow de Recherche

```
Query utilisateur
    |
    v
Cache Redis -> Hit ? -> Return cached
    |
    v (miss)
Tavily Search (5-10 resultats)
    |
    v
Pour chaque resultat:
  - Jina AI Reader (extraction)
  - Verification domain
  - Score de confiance
    |
    v
Aggregation + Ranking
    |
    v
Cache + Return
```

### Composants

| Service | Role | Technologie |
|---------|------|-------------|
| SearchService | Orchestration | TypeScript |
| TavilyClient | API search | SDK officiel |
| JinaClient | Extraction | API REST |
| CacheService | Caching | Redis |
| VerificationService | Scoring | Custom + LLM |

---

## Couts Estimes

### Scenario : 1,000 pages/mois

| Service | Usage | Cout estime |
|---------|-------|-------------|
| Tavily | 5,000 searches | ~$40 |
| Jina AI | 10,000 extractions | Free tier |
| Redis | Cache | ~$10 |
| **Total** | | ~$50/mois |

### Scenario : 10,000 pages/mois

| Service | Usage | Cout estime |
|---------|-------|-------------|
| Bright Data | 50,000 searches | ~$75 |
| Firecrawl | 20,000 extractions | ~$100 |
| Redis | Cache | ~$30 |
| **Total** | | ~$205/mois |

---

## Voir Aussi

- [Backend Architecture](../architecture/backend.md)
- [Source Verification](./source-verification.md)
- [Entity Extraction](../features/entity-extraction.md)
