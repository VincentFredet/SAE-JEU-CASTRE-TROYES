# Kaalmûl — La Rumeur (brief & règles, canon)

> Jeu de société **avec app compagnon**. L'app est l'**arbitre** : elle garde tous les
> secrets (équipes, indices, mensonges) et tranche. **Le jeu se parle à la table** —
> l'app ne gère pas la discussion. **1 téléphone par joueur, en ligne (salon).**

## Le pitch
La cité-temple perdue de **Kaalmûl** ressort de la jungle et du désert. Deux cultes
rivaux s'y disputent ses reliques sacrées : le **Soleil** et la **Lune**. Tu fais partie
d'un culte — mais **tu ne sais pas qui d'autre en est**. Ton équipe doit **localiser sa
relique** dans les ruines avant l'autre. Les **anciens (PNJ) ne mentent jamais** ; les
**chercheurs (les joueurs), si**. Tout le jeu : *« à qui se fier, et qui ment ? »*

## Format
- **4 ou 6 joueurs** (nombre pair pour l'instant). 2 équipes égales : **2v2** ou **3v3**.
- **~20-25 min.** 1 tel/joueur, salon en ligne.
- Thème **maya / jungle + désert** (art, carte, PNJ déjà produits).

## Mise en place (l'app fait tout, en secret)
1. Les joueurs rejoignent un **salon** (code). Au complet (pair), la partie démarre.
2. L'app **répartit les équipes** en secret (Soleil / Lune). Chaque tel n'affiche **que
   son propre camp**.
3. L'app place la **relique du Soleil** et la **relique de la Lune** dans **2 des 5 ruines**
   (les 3 autres sont des **leurres**, vides). Position **secrète**.
4. L'app génère les indices et **distribue à chacun** une main privée + **un indice
   d'ouverture** (à annoncer à voix haute au 1er tour, pour lancer la machine).

## La carte
**5 ruines** (sur la carte peinte), des **emplacements PNJ**, reliées par des chemins.
Chaque joueur a un pion. **Le seul coût du jeu, c'est le déplacement** : pour fouiller,
interroger ou troquer, il faut **être au bon endroit**, et s'y rendre **prend des tours**.
On ne peut pas être partout — la carte fait le tempo.

## Les indices — deux familles
Tous peuvent être **relayés vrai ou faux** entre joueurs. Les **PNJ donnent toujours la
version vraie**.
- **Lieu** (élimination) : *« la relique du Soleil n'est PAS au Cénote »*, *« celle de la
  Lune est dans une ruine près de l'eau »*. Il faut **~3-4 indices de lieu** pour réduire
  à **1 ruine sur 5**. (Jamais résolu en 2 indices.)
- **Identité** (obliques, pour trouver tes alliés) : *« deux d'entre vous servent la Lune »*,
  *« X et Y ne sont PAS du même bord »*, *« l'un de A/B/C est Soleil »*. **Jamais** un
  « X est ton allié » direct.

## Un tour
1. **Te déplacer** (0 à 2 cases).
2. **Une action, là où tu es :**
   - **Ruine** → **Fouiller** : l'app te donne un **indice de lieu vrai**.
   - **PNJ** → **Interroger** (vérité garantie) :
     - **le Scribe** & **le Guide** → indices de **lieu** ;
     - **la Conteuse** → indice d'**identité** (qui est avec qui, oblique) ;
     - **le Guetteur** → **détecteur de mensonge** : désigne un indice qu'un joueur t'a
       donné → l'app dit **vrai / faux** (et le note).
   - **Joueur (même case)** → **Troquer** : tu lui passes **un indice que tu détiens**,
     en le disant **vrai ou faux** (tu l'annonces à voix haute ; l'app note **qui** a dit
     **quoi** à **qui**). La réciprocité se **négocie à l'oral**.
   - **Réclamer** → déclenche la réclamation finale (voir Victoire).

## Mentir & démasquer
- **Seuls les joueurs mentent.** Mentir = passer un indice **faux** dans un troc.
- **Démasquer** : soit via **le Guetteur**, soit par **recoupement** — dès qu'un indice
  **vrai d'un PNJ** contredit ce qu'un joueur t'a dit, **il est démasqué** (l'app le
  signale). **Pas de points, pas de marque** : la sanction est que **tu sais maintenant
  qu'il t'est hostile** et **tu récupères la vérité**.

## Trouver ses alliés
Pas au pif : via les **indices d'identité de la Conteuse** + en **recoupant chez les PNJ**
qui t'a dit vrai (un joueur qui te dit toujours vrai = sûrement un allié). L'app tient le
**carnet** (qui t'a donné quoi, et ce qui a été confirmé vrai/faux) → tu raisonnes sur les
**gens**, pas sur la paperasse.

## Victoire — la Réclamation (à double tranchant)
Un joueur **Réclame** (idéalement depuis la ruine qu'il croit être la bonne). L'app ouvre
une **fenêtre simultanée** : **chacun soumet en secret la ruine de la relique de SON
équipe.** L'app compare les **deux camps** :

| Ton équipe | Équipe adverse | Résultat |
|---|---|---|
| majorité **juste** | **faux** | **ton équipe GAGNE** |
| majorité **juste** | majorité **juste** | **l'équipe qui a déclenché PERD** (l'autre gagne) |
| **faux** | — | échec : tu perds, ton équipe **bloquée 1 manche** |
| faux | faux | personne ; la partie continue, déclencheur bloqué 1 manche |

→ Tu ne réclames que si tu crois **ton camp prêt ET l'ennemi pas encore**. D'où l'intérêt
de **pister aussi la relique adverse** : aucun indice n'est inutile.

**Fin sèche :** au bout de **~8 manches**, si personne n'a gagné, l'équipe la **plus
avancée** (le plus d'indices de lieu confirmés pour sa relique) l'emporte. Pas de nul.

## Ce qu'on NE met PAS (anti-brouillon)
Pas de **points/score**, pas de **marque menteur**, pas d'**argent/économie**, pas de
**rôle** au-delà de l'équipe. Tout ce qui reste sert : *aller quelque part → obtenir un
indice → juger vrai/faux → cartographier son camp → réclamer au bon moment.*

## Architecture technique (cible)
- **`@jeux/shared`** : moteur pur, testé (état, équipes, distribution d'indices, actions,
  résolution de la réclamation). Aucune I/O.
- **`apps/realtime`** (Socket.IO) : **salons**, autorité de l'état, tours, fenêtre de
  réclamation, **vues privées** par joueur.
- **`apps/web`** : **lobby** (créer/rejoindre un salon) + **vue de jeu** par joueur (carte,
  carnet privé, actions, réclamation). On **fait évoluer `/rumeur`** vers ce jeu ; on garde
  l'**art, la carte, les PNJ maya**.
- **Pair uniquement** pour l'instant (4 ou 6) ; l'impair (électron libre) viendra après.
