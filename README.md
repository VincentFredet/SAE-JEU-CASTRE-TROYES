# SAÉ — Jeu de société en ligne

Site du jeu : vitrine, boutique, comptes joueurs, classement et parties multijoueur en temps réel. Multilingue FR/EN.

> Les règles du jeu ne sont pas encore figées. Le dépôt pose d'abord les systèmes stables (auth, i18n, boutique, scores, moteur de partie générique) ; les règles viendront se brancher dessus.

## Stack

- **Next.js 16** (App Router, React 19) + **TypeScript** + **Tailwind v4**
- **next-intl** — FR/EN, routage `/[locale]`
- **Auth.js (NextAuth v5)** + **Prisma 6** + **PostgreSQL 15**
- **Socket.IO** — service Node séparé pour le temps réel
- **Vitest** / **Playwright** — tests
- Monorepo **pnpm**

## Structure

```
apps/
  web/        Next.js — vitrine, boutique, auth, classement, UI du jeu
  realtime/   Service Socket.IO — parties temps réel
packages/
  db/         Prisma (schéma + client)
  shared/     Types et contrats partagés (events, tokens)
```

## Prérequis

- Node ≥ 20 (voir `.nvmrc`) — `corepack enable` active pnpm
- Docker (recommandé, pour PostgreSQL) — ou un PostgreSQL 15 local

## Démarrage rapide

```bash
pnpm install
docker compose up -d   # lance PostgreSQL (attends ~5 s qu'il démarre)
pnpm bootstrap             # crée les .env, applique le schéma, ajoute les données de démo
pnpm dev               # site → http://localhost:3000
```

`pnpm bootstrap` est idempotent : il ne réécrit pas un `.env` déjà présent. Pour le jeu
en ligne, lance le serveur temps réel dans un second terminal :

```bash
pnpm dev:rt            # serveur de jeu → http://localhost:4000
```

### Sans Docker

Si tu as déjà PostgreSQL, crée le rôle et la base attendus, puis lance `pnpm bootstrap` :

```sql
CREATE ROLE jeux LOGIN PASSWORD 'jeux_dev_pwd';
CREATE DATABASE jeux OWNER jeux;
```

Sinon, adapte `DATABASE_URL` dans les fichiers `.env` créés par `pnpm bootstrap`.

### En cas de souci

- `pnpm bootstrap` échoue sur la connexion ? PostgreSQL n'est pas encore prêt : attends
  quelques secondes puis relance `pnpm bootstrap`.
- Repartir d'une base propre : `pnpm db:reset` (réapplique le schéma + seed).

## Comptes de démo

| Rôle  | E-mail             | Mot de passe |
| ----- | ------------------ | ------------ |
| Admin | admin@jeux.test    | admin1234    |
| Joueur| joueur@jeux.test   | joueur1234   |

## Paiement (Stripe)

Le paiement est **optionnel**. Sans clés Stripe, le checkout valide directement la
commande (mode démo). Avec des clés de test, il redirige vers Stripe Checkout :

```bash
# dans apps/web/.env.local
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."   # donné par la commande ci-dessous
```

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Carte de test : `4242 4242 4242 4242`, date future, CVC quelconque. La commande
passe en `PAID` (stock décrémenté, panier vidé) via le webhook.

## Scripts

| Commande           | Effet                                       |
| ------------------ | ------------------------------------------- |
| `pnpm bootstrap`       | `.env` + schéma + données de démo (1 commande) |
| `pnpm dev`         | Site web (Next.js)                          |
| `pnpm dev:rt`      | Service temps réel (Socket.IO)              |
| `pnpm build`       | Build de production                         |
| `pnpm lint`        | ESLint                                      |
| `pnpm typecheck`   | Vérification des types                      |
| `pnpm test`        | Tests unitaires (Vitest)                    |
| `pnpm test:e2e`    | Tests end-to-end (Playwright)               |
| `pnpm db:deploy`   | Applique les migrations (non-interactif)    |
| `pnpm db:seed`     | Données de démo                             |
| `pnpm db:studio`   | Prisma Studio                               |
| `pnpm db:reset`    | Réinitialise la base (schéma + seed)        |

## État d'avancement

- [x] Monorepo, Next.js, Tailwind
- [x] Multilingue FR/EN
- [x] Schéma BDD + migrations + seed
- [x] Authentification (comptes, sessions, profil)
- [x] Boutique + panier + commande + paiement Stripe (optionnel)
- [x] Classement + espace de jeu
- [x] Intégration temps réel (lobby, parties, tours)
- [x] Tests (Vitest) + CI (GitHub Actions)
- [ ] Règles détaillées du jeu (le moteur et la page sont prêts)

Le moteur de jeu est volontairement générique (tour par tour) en attendant les
règles. Pour tester le multijoueur sans le site, le service temps réel accepte
une identité directe quand `ALLOW_DEV_AUTH=1`.
