# PedIA - Streaming UI & Progress Visualization

## Concept

L'utilisateur voit chaque etape de la generation en temps reel, creant une experience transparente et engageante.

---

## Architecture

### Protocol : SSE (Server-Sent Events)

**Pourquoi SSE plutot que WebSocket ?**

| Critere | SSE | WebSocket |
|---------|-----|-----------|
| Direction | Unidirectionnel | Bidirectionnel |
| Reconnexion | Automatique | Manuelle |
| Complexite | Simple | Plus complexe |
| Firewall | HTTP standard | Peut etre bloque |
| Use case | Streaming AI | Chat temps reel |

Pour la generation AI, SSE est ideal car le flux est uniquement serveur -> client.

---

## Types d'Events

### Step Events

| Event | Payload | Description |
|-------|---------|-------------|
| step_start | step, details | Etape commence |
| step_complete | step, duration | Etape terminee |
| step_error | step, error, recoverable | Erreur sur etape |

### Content Events

| Event | Payload | Description |
|-------|---------|-------------|
| content_chunk | content | Fragment de texte |
| entity_found | entity | Entite detectee |
| source_added | source | Source ajoutee |

### Lifecycle Events

| Event | Payload | Description |
|-------|---------|-------------|
| existing | pageId, slug | Page existe deja |
| complete | pageId, slug, title | Generation terminee |

---

## Etapes de Generation

| # | Step ID | Label Affiche | Description |
|---|---------|---------------|-------------|
| 1 | search | Recherche web | Query Tavily/Bright Data |
| 2 | analyze | Analyse sources | Extraction contenu |
| 3 | verify | Verification | Score de fiabilite |
| 4 | generate | Generation | LLM produit le contenu |
| 5 | extract | Extraction entites | NER sur le contenu |
| 6 | link | Creation liens | Dedup + relations |
| 7 | save | Sauvegarde | PostgreSQL + Qdrant |

---

## UI Components

### SearchProgress

Affiche la liste des etapes avec:
- **Icone status** : cercle (pending), spinner (en cours), check (done), X (error)
- **Label** : Nom de l'etape
- **Details** : Information contextuelle (ex: "5 sources trouvees")
- **Duration** : Temps ecoule (apres completion)

**Couleurs** :
- Pending : Gris
- In progress : Bleu avec animation
- Complete : Vert
- Error : Rouge

### StreamingContent

Affiche le contenu markdown au fur et a mesure:
- Rendu incremental du markdown
- Curseur clignotant pendant le streaming
- Gestion des blocs incomplets (code, listes)

### EntitiesFound

Liste des entites detectees:
- Badges colores par type
- Indication "new" si nouvelle entite
- Click pour voir la page (si existe)

### SourcesList

Sources utilisees:
- Titre cliquable (lien externe)
- Indicateur de confiance (vert/jaune/rouge)

---

## UX Patterns

### Progressive Disclosure

1. D'abord les etapes (structure)
2. Puis le contenu (streaming)
3. Puis les entites (enrichissement)
4. Enfin redirection vers page

### Skeleton Loading

Avant le premier event:
- Skeleton des etapes
- Placeholder du contenu

### Error Recovery

Si une etape echoue:
- Afficher l'erreur clairement
- Si recoverable : retry automatique
- Si fatal : bouton "Reessayer"

### Completion Animation

A la fin:
- Toutes les etapes passent en vert
- Confetti subtil (optionnel)
- Redirect apres 2s ou click

---

## Performance

### Batching Updates

Les chunks de contenu arrivent rapidement. Pour eviter le re-render excessif:
- Buffer les chunks pendant 50ms
- Flush en une seule mise a jour
- Utiliser refs pour eviter re-renders

### Virtualization

Pour les tres longues pages:
- Virtualiser le contenu markdown
- Rendre seulement la partie visible
- Lazy load des sections

### Memory Management

A la completion:
- Fermer l'EventSource
- Clear les buffers
- Garbage collect le contenu intermediaire

---

## Accessibility

### Screen Readers

- Annoncer chaque changement d'etape
- Live region pour le contenu streaming
- Focus management a la completion

### Keyboard

- Escape pour annuler
- Enter pour confirmer redirect
- Tab entre les elements interactifs

### Reduced Motion

- Pas d'animations si `prefers-reduced-motion`
- Transitions instantanees

---

## Mobile Considerations

### Touch

- Swipe pour dismiss
- Long press pour details

### Layout

- Etapes en accordeon sur petit ecran
- Contenu prend toute la largeur
- Entites en carousel horizontal

### Performance

- Moins de chunks par batch
- Desactiver animations complexes
- Limiter la profondeur de re-render

---

## Metriques

### A Tracker

| Metrique | Description |
|----------|-------------|
| Time to first event | Latence initiale |
| Time per step | Duree de chaque etape |
| Total generation time | Temps total |
| Error rate | % de generations echouees |
| Abandonment rate | % de users qui quittent avant fin |

### Monitoring

- Dashboard temps reel
- Alertes sur latence anormale
- Distribution des temps par etape

---

## Voir Aussi

- [Frontend Architecture](../architecture/frontend.md)
- [Backend Architecture](../architecture/backend.md)
- [Graph Visualization](./graph-visualization.md)
