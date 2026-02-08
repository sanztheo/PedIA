# NIXOU - Graph Evolution & Verification

## Mission

Ameliorer le systeme de queues pour detecter les liens manquants et verifier la coherence du graph. Si page A mentionne B, alors B doit mentionner A.

---

## Pourquoi

Actuellement les workers extract/link/enrich fonctionnent mais :
- Pas de verification des liens bidirectionnels
- Pas de rate limiting sur enrichissement (risque de boucle infinie)
- Pas de worker pour verifier les liens existants

---

## Fichiers a Creer

| Fichier | Action |
|---------|--------|
| `backend/src/queue/workers/verifyWorker.ts` | CREER |
| `backend/tests/verify.test.ts` | CREER |

## Fichiers a Modifier

| Fichier | Action |
|---------|--------|
| `backend/src/queue/queues.ts` | Ajouter queue verify |
| `backend/src/queue/index.ts` | Demarrer verifyWorker |
| `backend/src/queue/workers/enrichWorker.ts` | Ajouter rate limiting |
| `backend/src/services/graph.service.ts` | Ajouter methode detection liens manquants |

---

## Direction Technique

### 1. Queue Verify

Ajouter une 4eme queue dans `queues.ts` :
- Nom : `verify`
- Priorite : 3 (basse, background)
- But : verifier periodiquement la coherence du graph

### 2. VerifyWorker

Creer un worker qui :
- Prend un `pageId` en input
- Recupere toutes les entites de cette page
- Pour chaque entite qui a une page :
  - Verifier que cette page mentionne la page source
  - Si non -> creer un job pour ajouter le lien manquant

**Logique** :
```
Page "Tesla" mentionne entite "Elon Musk"
    |
    v
Entite "Elon Musk" a une page ?
    |
    v
OUI -> Page "Elon Musk" mentionne "Tesla" ?
    |
    v
NON -> Flag comme lien manquant
```

### 3. Detection Liens Bidirectionnels

Ajouter dans `GraphService` :
- `findMissingBacklinks(pageId)` - trouver les liens unidirectionnels
- `createBacklink(sourcePageId, targetPageId)` - creer le lien inverse

**Attention** : Ne pas modifier le contenu de la page automatiquement, juste creer la relation dans la DB.

### 4. Rate Limiting EnrichWorker

Probleme actuel : enrichWorker peut generer des pages en boucle infinie.

Solutions a implementer :
- Max 10 pages generees par heure
- Skip si entite deja en queue
- Skip si entite a moins de 3 mentions totales
- Cooldown entre generations (delay progressif)

Utiliser les options BullMQ :
- `rateLimiter` pour limiter le debit
- `attempts` + `backoff` pour retry intelligent

### 5. Orchestration

Modifier `index.ts` pour :
- Demarrer le verifyWorker
- Ajouter health check pour la queue verify
- Planifier des jobs verify periodiques (cron-like)

---

## Flow Verify

```
Cron toutes les heures
    |
    v
Pour chaque page modifiee recemment
    |
    v
Ajouter job verify queue
    |
    v
VerifyWorker analyse
    |
    v
Liens manquants detectes -> Log ou action
```

---

## Criteres de Succes

- [ ] Queue verify creee et fonctionnelle
- [ ] VerifyWorker detecte les liens manquants
- [ ] EnrichWorker respecte le rate limit
- [ ] Pas de boucle infinie possible
- [ ] Tests passent

---

## Tests

```bash
npm run typecheck
node --env-file=.env --import=tsx tests/queue.test.ts
node --env-file=.env --import=tsx tests/verify.test.ts
```

---

## Ressources

- BullMQ Rate Limiter : https://docs.bullmq.io/guide/rate-limiting
- BullMQ Repeatable Jobs : https://docs.bullmq.io/guide/jobs/repeatable

---

## Ne Pas Toucher

- `backend/src/services/embedding.service.ts` (zone Theo)
- `backend/src/routes/search.ts` (zone Theo)
- `frontend/` (zones Glamgar et Kofu)
