# KOFU - Testing & Authentication

## Mission

Mettre en place les tests E2E avec Playwright et preparer l'infrastructure d'authentification avec Clerk.

---

## Pourquoi

- Aucun test E2E actuellement = regressions possibles
- Auth necessaire pour Phase 6 (admin, moderation, rate limiting user)

---

## Fichiers a Creer

| Fichier | Action |
|---------|--------|
| `frontend/playwright.config.ts` | CREER |
| `frontend/e2e/home.spec.ts` | CREER |
| `frontend/e2e/search.spec.ts` | CREER |
| `frontend/e2e/wiki.spec.ts` | CREER |
| `frontend/lib/auth.ts` | CREER |
| `frontend/middleware.ts` | CREER |
| `backend/src/routes/auth.ts` | CREER |
| `backend/src/middleware/auth.ts` | CREER |

## Fichiers a Modifier

| Fichier | Action |
|---------|--------|
| `frontend/package.json` | Ajouter Playwright + Clerk deps |
| `backend/package.json` | Ajouter Clerk SDK |

---

## Direction Technique

### PARTIE 1 : Tests E2E

#### 1. Setup Playwright

Initialiser Playwright dans le frontend :
- Config pour Chrome/Firefox/Safari
- Base URL vers localhost:3000
- Screenshots on failure
- Timeout raisonnables

#### 2. Test Home (home.spec.ts)

Scenarios a tester :
- Page d'accueil se charge
- SearchBar est visible et focusable
- Navigation vers /explore fonctionne
- Logo cliquable ramene a l'accueil

#### 3. Test Search (search.spec.ts)

Scenarios a tester :
- Recherche d'un terme affiche GenerationProgress
- Les etapes s'affichent en sequence
- Redirection vers /wiki/[slug] apres completion

**Note** : Mocker l'API backend pour tests rapides et deterministes.

#### 4. Test Wiki (wiki.spec.ts)

Scenarios a tester :
- Page wiki s'affiche avec contenu
- MarkdownContent rend correctement
- EntitySidebar affiche les entites
- Liens [[Entity]] sont cliquables
- Bouton "Voir le graph" fonctionne

---

### PARTIE 2 : Authentication (Clerk)

#### 1. Pourquoi Clerk

- Setup rapide (< 1h)
- UI pre-faite (sign in/up)
- Webhooks pour sync DB
- Free tier genereux

#### 2. Frontend Auth (lib/auth.ts)

Wrapper autour de Clerk :
- `getCurrentUser()` - recuperer user connecte
- `requireAuth()` - redirect si non connecte
- `isAdmin()` - verifier role admin

#### 3. Middleware Next.js

Creer `middleware.ts` a la racine de frontend :
- Proteger certaines routes (ex: /admin/*)
- Laisser les routes publiques accessibles
- Injecter le user dans les server components

#### 4. Backend Auth (middleware/auth.ts)

Middleware Hono pour verifier les tokens Clerk :
- Valider le JWT dans le header Authorization
- Extraire userId et roles
- Injecter dans le context Hono

#### 5. Route /api/auth

Endpoints utiles :
- `GET /api/auth/me` - infos user courant
- `POST /api/auth/webhook` - webhook Clerk pour sync

---

## Flow Auth

```
User clique "Sign In"
    |
    v
Clerk UI (hosted ou embedded)
    |
    v
Redirect avec session
    |
    v
Middleware Next.js valide
    |
    v
API calls avec token dans header
    |
    v
Backend middleware valide token
```

---

## Priorite

1. **Tests E2E** (plus urgent) - permet de valider les features des autres
2. **Auth** (preparation) - peut etre fait en parallele

---

## Criteres de Succes

### Tests
- [ ] Playwright configure et fonctionne
- [ ] Test home passe
- [ ] Test search passe (avec mock)
- [ ] Test wiki passe
- [ ] CI peut runner les tests

### Auth
- [ ] Clerk configure (dashboard)
- [ ] Sign in/up fonctionne sur frontend
- [ ] Routes protegees redirigent
- [ ] Backend valide les tokens
- [ ] User info accessible dans l'app

---

## Tests

```bash
# Installer Playwright
cd frontend && npx playwright install

# Runner les tests
cd frontend && npx playwright test

# Mode UI (debug)
cd frontend && npx playwright test --ui
```

---

## Ressources

### Playwright
- Getting Started : https://playwright.dev/docs/intro
- Best Practices : https://playwright.dev/docs/best-practices

### Clerk
- Next.js Quickstart : https://clerk.com/docs/quickstarts/nextjs
- Hono Integration : https://clerk.com/docs/references/backend/overview
- Webhooks : https://clerk.com/docs/integrations/webhooks

---

## Ne Pas Toucher

- `backend/src/queue/` (zone Nixou)
- `backend/src/services/embedding.service.ts` (zone Theo)
- `frontend/components/wiki/SourcesPanel.tsx` (zone Glamgar)
- `frontend/components/graph/` (stable)
