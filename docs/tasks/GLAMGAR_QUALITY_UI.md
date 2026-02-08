# GLAMGAR - Quality & Trust UI

## Mission

Ajouter des composants UI pour la transparence : afficher les sources utilisees, le score de confiance, et permettre aux utilisateurs de signaler des problemes.

---

## Pourquoi

Les utilisateurs doivent pouvoir :
- Voir d'ou viennent les informations (sources)
- Evaluer la fiabilite d'une page (score confiance)
- Signaler du contenu problematique

---

## Fichiers a Creer

| Fichier | Action |
|---------|--------|
| `frontend/components/wiki/SourcesPanel.tsx` | CREER |
| `frontend/components/wiki/ConfidenceBadge.tsx` | CREER |
| `frontend/components/wiki/ReportButton.tsx` | CREER |
| `frontend/components/wiki/ReportModal.tsx` | CREER |
| `backend/src/routes/reports.ts` | CREER |

## Fichiers a Modifier

| Fichier | Action |
|---------|--------|
| `frontend/app/wiki/[slug]/page.tsx` | Integrer les nouveaux composants |
| `backend/src/app.ts` | Ajouter route reports |

---

## Direction Technique

### 1. SourcesPanel

Composant qui affiche les sources utilisees pour generer la page.

**Props attendues** :
- `sources` : liste des sources (url, titre, domain)
- `className` : pour styling

**UI suggeree** :
- Liste collapsible (ferme par defaut sur mobile)
- Favicon du domaine + titre cliquable
- Badge de fiabilite par source (si dispo)

**Placement** : Dans la sidebar droite ou en bas de page

### 2. ConfidenceBadge

Badge visuel indiquant le niveau de confiance de la page.

**Props attendues** :
- `score` : number 0-100
- `size` : 'sm' | 'md' | 'lg'

**UI suggeree** :
- Couleur selon score : vert (>80), jaune (50-80), rouge (<50)
- Tooltip expliquant le score au hover
- Icone + texte ("Haute confiance", "A verifier", etc.)

**Placement** : Dans le PageHeader, a cote du titre

### 3. ReportButton + ReportModal

Bouton pour signaler un probleme avec modal de formulaire.

**ReportButton** :
- Bouton discret (icone flag)
- Ouvre ReportModal au click

**ReportModal** :
- Select du type de probleme :
  - Information incorrecte
  - Source douteuse
  - Contenu biaise
  - Autre
- Textarea pour details
- Bouton submit

**Backend** : Creer route `POST /api/reports` pour recevoir les signalements

### 4. Integration Page Wiki

Modifier `frontend/app/wiki/[slug]/page.tsx` pour :
- Fetch les sources avec la page (modifier l'API si besoin)
- Afficher ConfidenceBadge dans le header
- Afficher SourcesPanel dans la sidebar ou en bas
- Afficher ReportButton en bas de page

---

## Schema API Reports

```
POST /api/reports
Body: {
  pageId: string
  type: 'incorrect' | 'source' | 'bias' | 'other'
  details: string
  userEmail?: string (optionnel)
}

Response: { success: true, reportId: string }
```

**Note** : Pour l'instant, stocker en DB ou logger. Pas besoin de systeme de moderation complet.

---

## Composants UI a Utiliser

Le projet utilise shadcn/ui. Composants utiles :
- `Sheet` ou `Dialog` pour le modal
- `Badge` pour le score
- `Button` variante ghost pour ReportButton
- `Select` et `Textarea` pour le formulaire

---

## Criteres de Succes

- [ ] SourcesPanel affiche les sources correctement
- [ ] ConfidenceBadge change de couleur selon le score
- [ ] ReportModal s'ouvre et se ferme proprement
- [ ] Signalement envoye au backend
- [ ] Responsive (mobile OK)
- [ ] Accessible (a11y)

---

## Tests

```bash
cd frontend && npm run lint
cd frontend && npm run build
```

Test manuel : naviguer sur une page wiki et verifier les composants.

---

## Ressources

- shadcn/ui : https://ui.shadcn.com/
- Lucide icons : https://lucide.dev/icons (pour icones)
- Composants existants : `frontend/components/ui/`

---

## Ne Pas Toucher

- `backend/src/queue/` (zone Nixou)
- `backend/src/services/embedding.service.ts` (zone Theo)
- `frontend/e2e/` (zone Kofu)
- `frontend/components/graph/` (stable)
- `frontend/components/generation/` (stable)
