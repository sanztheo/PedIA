# PedIA - AI Markdown Editing (Zone-Based)

## Concept

L'IA de PedIA peut modifier des sections specifiques d'une page existante sans regenerer tout le contenu. C'est essentiel pour:
- Ajouter des informations manquantes
- Mettre a jour des sections obsoletes
- Enrichir des pages avec de nouveaux liens

---

## Architecture d'Edition

### Approche AST (Abstract Syntax Tree)

Le markdown est parse en arbre syntaxique pour identifier les sections:

1. **Parsing** : Markdown -> AST (via remark/unified)
2. **Identification** : Chaque section recoit un ID unique (ex: `section_2_1`)
3. **Modification** : L'IA cible une section specifique par son ID
4. **Reconstruction** : AST modifie -> Markdown

### Identification des Sections

Chaque element du document est indexe:
- **Headings** : `section_{depth}_{index}` (ex: `section_2_3` = 3eme H2)
- **Paragraphs** : `para_{section}_{index}`
- **Lists** : `list_{section}_{index}`
- **Code blocks** : `code_{section}_{index}`

---

## Editors Recommandes

### Pour PedIA

| Editor | Usage | Raison |
|--------|-------|--------|
| **Tiptap** | Edition utilisateur | API React simple, extensible |
| **remark/unified** | Processing backend | Standard industrie, 150+ plugins |
| **Monaco** (optionnel) | Mode source | Experience VS Code |

### Pourquoi Tiptap ?

- Base ProseMirror (robuste, utilise par NYTimes, Atlassian)
- Extension markdown bidirectionnelle
- Headless (style libre)
- Collaboration temps reel possible

---

## AI Tools pour Edition

### Pattern Anthropic (str_replace)

L'approche officielle d'Anthropic utilise le remplacement de chaine:
- Identifie le texte exact a remplacer
- Fournit le nouveau contenu
- Valide l'unicite du match

**Avantages** : Simple, predictible
**Inconvenients** : Peut echouer si le texte n'est pas unique

### Pattern Section-Based (Recommande pour PedIA)

Approche plus robuste basee sur les IDs de section:

1. L'IA recoit la liste des sections avec leurs IDs
2. Elle choisit la section a modifier
3. Elle genere le nouveau contenu pour cette section
4. Le systeme applique le changement

**Avantages** : Pas d'ambiguite, modifications precises
**Inconvenients** : Necessite indexation prealable

---

## Tools Disponibles

### edit_section
Remplace le contenu d'une section entiere par son ID.

**Parametres** :
- `section_id` : ID de la section cible
- `new_content` : Nouveau markdown
- `reason` : Justification de la modification

### insert_after
Insere du contenu apres une section existante.

**Parametres** :
- `after_section_id` : Section apres laquelle inserer
- `content` : Contenu a inserer
- `type` : Type de contenu (paragraph, heading, list)

### append_to_section
Ajoute du contenu a la fin d'une section.

**Parametres** :
- `section_id` : Section cible
- `content` : Contenu a ajouter

### delete_section
Supprime une section (rarement utilise).

**Parametres** :
- `section_id` : Section a supprimer

---

## Workflow d'Edition

### Scenario : Enrichir une page Tesla avec SpaceX

1. **Trigger** : Nouvelle page SpaceX creee, liee a Elon Musk
2. **Detection** : Page Tesla mentionne Elon Musk mais pas SpaceX
3. **Analyse** : IA identifie la section "Voir aussi" (section_6_1)
4. **Edition** : Tool `append_to_section` ajoute lien SpaceX
5. **Sauvegarde** : Page mise a jour, cache invalide

### Scenario : Correction d'information

1. **Detection** : Source plus recente disponible
2. **Analyse** : IA compare les informations
3. **Decision** : Section specifique necessitant mise a jour
4. **Edition** : Tool `edit_section` avec nouveau contenu
5. **Historique** : Version precedente archivee

---

## Gestion des Conflits

### Detection

Avant chaque modification:
1. Verifier la version actuelle de la page
2. Comparer avec la version au moment de l'analyse
3. Si difference -> conflit potentiel

### Resolution

| Cas | Action |
|-----|--------|
| Section non modifiee | Appliquer directement |
| Section modifiee, pas de chevauchement | Merge automatique |
| Section modifiee, chevauchement | Queue pour review humain |

---

## Versioning

### Historique des Modifications

Chaque modification est tracee:
- **Qui** : System (auto) ou User
- **Quoi** : Section modifiee, diff
- **Quand** : Timestamp
- **Pourquoi** : Raison fournie

### Rollback

Possibilite de revenir a une version anterieure:
- Par section (granulaire)
- Par page entiere (global)

---

## Bonnes Pratiques

### Pour l'IA

1. **Toujours justifier** les modifications (champ `reason`)
2. **Minimiser les changements** : modifier seulement ce qui est necessaire
3. **Preserver le style** : adapter au ton existant de la page
4. **Verifier les liens** : s'assurer que les nouvelles references existent

### Pour le Systeme

1. **Indexer a la creation** : parser les sections immediatement
2. **Valider avant apply** : verifier que la section existe
3. **Backup avant modification** : toujours garder l'original
4. **Notifier les changements** : invalidation cache, webhooks

---

## Streaming des Modifications

L'UI peut montrer les modifications en temps reel:

1. **Highlight** : Section en cours de modification surlignee
2. **Diff Preview** : Ancien vs nouveau en split view
3. **Progress** : Indicateur de generation en cours
4. **Confirmation** : Preview avant application (optionnel)

---

## Voir Aussi

- [Backend Architecture](../architecture/backend.md)
- [Streaming UI](./streaming-ui.md)
- [Entity Extraction](./entity-extraction.md)
