# PedIA - Source Verification & Bias Detection

## Objectif

PedIA vise la neutralite absolue. Cette recherche explore comment verifier les sources et detecter les biais.

---

## Problematique

### Biais des LLMs

Les recherches montrent que les LLMs:
- Classifient incorrectement certaines sources politiques
- Utilisent des associations lexicales plutot que du raisonnement
- Ont une correlation moderee avec les evaluations humaines (r = 0.50)

### Risques pour PedIA

Sans verification:
- Propagation de desinformation
- Biais dans la selection des sources
- Confiance injustifiee dans certaines sources

---

## Approche Multi-Niveaux

### Niveau 1 : Domain Authority

Verification automatisable:
- Age du domaine
- Trafic (SimilarWeb, Alexa rank)
- Presence Wikipedia
- HTTPS, structure professionnelle

**Score** : 0-100 base sur metriques objectives

### Niveau 2 : Content Analysis

Semi-automatisable:
- Presence de sources/citations
- Langage factuel vs emotionnel
- Distinction faits/opinions
- Date de publication

**Score** : 0-100 via analyse NLP

### Niveau 3 : Cross-Reference

Verification croisee:
- Meme information dans 2+ sources independantes
- Concordance des faits cles
- Discordances signalees

**Score** : 0-100 base sur concordance

### Score Final

```
Score = (Domain * 0.3) + (Content * 0.3) + (CrossRef * 0.4)
```

---

## Liste de Sources

### Tier 1 : Haute Confiance (Auto-accept)

| Source | Type | Raison |
|--------|------|--------|
| Wikipedia | Encyclopedie | Verification communautaire |
| Encyclopedia Britannica | Encyclopedie | Editorial rigoureux |
| Reuters | News | Factuel, peu de biais |
| Associated Press | News | Standard journalistique |
| Publications scientifiques | Academique | Peer-reviewed |
| Sites .gov, .edu | Institutionnel | Source officielle |

### Tier 2 : Confiance Moyenne (Verification)

| Source | Type | Action |
|--------|------|--------|
| Grands medias | News | Cross-reference |
| Blogs techniques | Opinion | Verifier les faits |
| Sites corporate | PR | Extraire faits, ignorer opinion |
| Forums (Reddit, HN) | UGC | Verification obligatoire |

### Tier 3 : Basse Confiance (Review Manuel)

| Source | Type | Action |
|--------|------|--------|
| Sites partisans | Opinion | Flag pour review |
| Sources anonymes | Inconnu | Cross-reference obligatoire |
| Social media | UGC | Eviter sauf citation |
| Sites obscurs | Inconnu | Verification manuelle |

---

## Detection de Biais

### Indicateurs Automatiques

| Signal | Interpretation |
|--------|----------------|
| Langage emotionnel | Potentiel biais |
| Generalisation excessive | Manque de nuance |
| Sources unilaterales | Echo chamber |
| Absence de contre-arguments | Biais de confirmation |

### Outils Existants

| Outil | Usage | Limite |
|-------|-------|--------|
| NewsGuard | Rating medias | Payant, US-centric |
| Biasly | Score politique | US-centric |
| MediaBiasFactCheck | Classification | Manual, pas API |
| AllSides | Comparaison | US politique |

### Approche PedIA

1. **Detection lexicale** : mots charges, superlatifs
2. **Analyse structurelle** : presence contre-arguments
3. **Comparaison sources** : divergences signalees
4. **Flag humain** : sujets controverses

---

## Sujets Sensibles

### Categories

| Categorie | Exemples | Approche |
|-----------|----------|----------|
| Politique | Elections, partis | Multi-source obligatoire |
| Religion | Doctrines, histoire | Sources academiques |
| Sante | Traitements, maladies | Sources medicales officielles |
| Histoire recente | Conflits, genocides | Historiographie etablie |
| Personnalites | Biographies | Faits verifiables uniquement |

### Regles

1. **Jamais de jugement de valeur** dans le contenu genere
2. **Presenter les differentes perspectives** quand pertinent
3. **Citer les sources** pour chaque affirmation
4. **Indiquer les controverses** clairement

---

## Workflow de Verification

### Etape 1 : Pre-filtrage

Avant utilisation d'une source:
- Verifier dans whitelist/blacklist
- Calculer domain score
- Rejeter si score < 30

### Etape 2 : Extraction

Pendant l'extraction:
- Separer faits et opinions
- Identifier les claims verifiables
- Noter les sources citees

### Etape 3 : Cross-Reference

Apres extraction:
- Comparer claims entre sources
- Calculer score de concordance
- Flagger les discordances

### Etape 4 : Generation

Pendant generation:
- Utiliser uniquement claims verifies
- Citer toutes les sources
- Indiquer incertitudes

### Etape 5 : Review

Post-generation:
- Queue pour review si sujet sensible
- Monitoring des flags utilisateurs
- Amelioration continue

---

## Metriques de Qualite

### KPIs

| Metrique | Cible | Mesure |
|----------|-------|--------|
| Factual accuracy | > 98% | Sampling + review |
| Source diversity | > 3 sources/page | Automatique |
| Bias score | < 0.2 | Analyse NLP |
| User flags | < 1% | Feedback utilisateur |

### Monitoring

- Dashboard temps reel des scores
- Alertes sur pages a biais eleve
- Review queue prioritise

---

## Limitations

### Ce que PedIA NE peut PAS garantir

1. Verite absolue sur sujets debattus
2. Absence totale de biais (LLM inherent)
3. Exhaustivite des perspectives
4. Mise a jour temps reel

### Transparence

Chaque page affiche:
- Sources utilisees avec liens
- Date de generation
- Score de confiance global
- Bouton "Signaler un probleme"

---

## Evolution Future

### Phase 1 (MVP)

- Whitelist/blacklist de domaines
- Score domain automatique
- Cross-reference basique

### Phase 2

- Analyse NLP du contenu
- Detection biais avancee
- Dashboard moderateur

### Phase 3

- ML model custom pour scoring
- Community flagging
- Fact-checking automatise

---

## Voir Aussi

- [Web Search APIs](./web-search-apis.md)
- [Entity Extraction](../features/entity-extraction.md)
- [Backend Architecture](../architecture/backend.md)
