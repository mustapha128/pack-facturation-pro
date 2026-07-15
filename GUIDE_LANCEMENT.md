# Guide de lancement — 3 étapes que toi seul peux faire

Ces 3 actions nécessitent ton identité/argent, donc personne d'autre ne peut les faire à ta place —
ni moi, ni un employé, ni personne. Voici comment les faire le plus vite possible.

## 1. Nom de domaine (5 min, ~12€/an)

1. Va sur https://www.namecheap.com ou https://www.ovh.com
2. Cherche un nom disponible (ex: `facturationpro.fr`, `moncompta.fr`...)
3. Achète-le avec ta carte bancaire
4. C'est tout — reviens vers moi avec le nom acheté, je le connecte au site.

## 2. Compte Stripe (10 min, gratuit à la création)

1. Va sur https://dashboard.stripe.com/register
2. Inscris-toi avec ton email
3. Renseigne :
   - Ton IBAN (pour recevoir les paiements de tes clients)
   - Ton statut : si tu n'as pas encore d'entreprise, choisis "Particulier" ou
     "Auto-entrepreneur" en cours de création (Stripe accepte de démarrer en mode test
     sans SIRET, mais il en faudra un pour activer les paiements réels)
4. Une fois inscrit, va dans "Développeurs" → "Clés API" → copie la "Clé secrète" (commence par `sk_`)
5. Envoie-moi cette clé (uniquement à moi, jamais publiquement) — je la mets dans la config

**Si tu n'as pas encore d'entreprise** : le plus simple et rapide en France est le statut
"auto-entrepreneur" (micro-entreprise) — inscription gratuite en ligne sur
https://www.autoentrepreneur.urssaf.fr, tu reçois un SIRET sous 2-4 semaines.

## 3. CGU/RGPD finalisées (à faire une fois que tu as ton entreprise)

1. Ouvre le fichier `LEGAL_MODELE_CGU_RGPD.md` dans ce dossier
2. Remplace tous les `[...]` par tes vraies infos (nom, adresse, SIRET)
3. Idéalement, fais-le relire par un juriste — certains services en ligne (Legalstart,
   Captain Contrat) le font pour un prix raisonnable
4. Une fois validé, dis-le-moi : je l'intègre dans l'application (lien dans le pied de page +
   case à cocher obligatoire à l'inscription)

---

**Ordre recommandé** : entreprise (auto-entrepreneur) → Stripe → domaine → CGU/RGPD.
Chaque étape peut se faire indépendamment, à ton rythme.
