# Modèle CGU / Politique de confidentialité — À COMPLÉTER ET FAIRE VALIDER

**Ceci n'est PAS un document juridique final.** C'est une trame de départ pour t'aider à réfléchir
à ce qu'il faut couvrir. Avant toute mise en ligne commerciale, fais relire (idéalement valider)
ce document par un avocat ou un service comme Legalstart/Captain Contrat — les logiciels qui
traitent des données clients (factures, contacts, transactions financières) sont directement
concernés par le RGPD, et une erreur ici peut coûter cher (amendes CNIL jusqu'à 4% du CA mondial).

Tous les champs entre `[...]` sont à remplacer avec tes informations réelles.

---

## 1. Conditions Générales d'Utilisation (CGU)

### 1.1 Éditeur
Ce service est édité par **Impasse Logiciels**, [forme juridique, ex: SASU/EURL],
au capital de [montant] €, immatriculée au RCS de [ville] sous le numéro [SIRET],
dont le siège social est situé [adresse].
Directeur de publication : [nom].
Contact : [email de contact].

### 1.2 Objet
Le service **[nom du logiciel, ex: Facturation Pro]** est une application de gestion en ligne
permettant à ses utilisateurs professionnels de [décrire : créer des factures, gérer des stocks,
suivre leur trésorerie, etc.].

### 1.3 Accès au service et abonnement
- Formule d'essai : [durée, ex: 14 jours, fonctionnalités incluses].
- Formule payante : [prix, périodicité, moyens de paiement acceptés].
- Résiliation : [préavis, modalités, remboursement].
- Le service est fourni "en l'état", avec un objectif de disponibilité de [ex: 99%], sans garantie
  de disponibilité absolue.

### 1.4 Obligations de l'utilisateur
- Fournir des informations exactes lors de l'inscription.
- Ne pas utiliser le service à des fins illégales.
- Assurer la confidentialité de ses identifiants de connexion.
- Rester seul responsable de l'exactitude des données saisies (factures, montants, TVA...).

### 1.5 Propriété intellectuelle
Le logiciel, son code, son design et sa marque restent la propriété de Impasse Logiciels.
Les données saisies par le client (clients, factures, contacts...) restent sa propriété.

### 1.6 Responsabilité
Impasse Logiciels ne saurait être tenue responsable des pertes de données résultant d'une
mauvaise utilisation du service par l'utilisateur, d'un cas de force majeure, ou d'une interruption
du service par un sous-traitant technique (hébergeur, etc.).

### 1.7 Droit applicable
Les présentes CGU sont soumises au droit [français / de ton pays]. Tout litige relève de la
compétence des tribunaux de [ville].

---

## 2. Politique de confidentialité (RGPD)

### 2.1 Responsable du traitement
Impasse Logiciels, [adresse], [email de contact DPO ou responsable].

### 2.2 Données collectées
- **Données de compte** : email, mot de passe (hashé), nom de l'entreprise.
- **Données métier saisies par le client** : selon le module — clients, factures, contacts,
  transactions financières, données de stock, données de caisse. Ces données peuvent inclure
  des données à caractère personnel de tiers (clients de tes clients).
- **Données techniques** : logs de connexion, adresse IP (à des fins de sécurité).

### 2.3 Finalités du traitement
- Fournir le service (authentification, sauvegarde des données métier).
- Facturer l'abonnement (via Stripe — voir 2.6).
- Assurer la sécurité et prévenir la fraude.
- [Si applicable] Communication commerciale, sous réserve du consentement.

### 2.4 Base légale
- Exécution du contrat (fourniture du service souscrit).
- Intérêt légitime (sécurité, prévention de la fraude).
- Consentement (le cas échéant, pour la communication commerciale).

### 2.5 Durée de conservation
- Données de compte : pendant toute la durée de l'abonnement + [durée légale, ex: 5 ans après
  résiliation pour les obligations comptables].
- Données métier (factures notamment) : conformément aux obligations légales de conservation
  des documents comptables applicables dans ton pays (en France : 10 ans pour les factures).

### 2.6 Sous-traitants et transferts de données
- **Hébergement** : [nom de l'hébergeur, ex: Render, OVH...], situé [pays — vérifier si hors UE].
- **Paiement** : Stripe (États-Unis, mécanismes de transfert conformes RGPD — clauses
  contractuelles types).
- Aucune donnée n'est vendue à des tiers.

### 2.7 Droits des personnes concernées
Conformément au RGPD, toute personne dispose d'un droit d'accès, de rectification, d'effacement,
de limitation, d'opposition et de portabilité de ses données. Ces droits s'exercent auprès de
[email de contact]. Un droit de réclamation existe auprès de la CNIL (cnil.fr) ou de l'autorité
de protection des données compétente.

### 2.8 Sécurité
Le service met en œuvre des mesures techniques (mots de passe hashés, connexions chiffrées HTTPS
en production, isolation des données par client) pour protéger les données. [Complète avec les
mesures réellement en place en production, notamment la sauvegarde et le chiffrement au repos.]

### 2.9 Cookies
[À compléter selon les cookies réellement utilisés — a priori uniquement des cookies techniques
nécessaires à l'authentification (token de session), ce qui limite les obligations de bannière
cookie, mais vérifie ce point avec un professionnel.]

---

## 3. Prochaines étapes concrètes

1. Remplis tous les champs `[...]` avec les informations réelles de ton entreprise.
2. Fais relire ce document par un professionnel du droit (obligatoire avant commercialisation
   sérieuse, surtout si tu factures des clients professionnels avec leurs propres clients dedans).
3. Ajoute un lien vers ces documents dans le footer de chaque application et dans le formulaire
   d'inscription (case à cocher "J'accepte les CGU et la politique de confidentialité").
4. Vérifie si ton activité nécessite une déclaration ou un registre des traitements RGPD
   (obligatoire pour la plupart des éditeurs de logiciels B2B traitant des données clients).
