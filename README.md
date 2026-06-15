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

- Node ≥ 20 (voir `.nvmrc`)
- pnpm 10
- PostgreSQL 15 en local

## Installation

```bash
pnpm install
cp .env.example .env            # adapter si besoin
```

Créer la base et appliquer le schéma :

```bash
# une base "jeux" avec un rôle "jeux" (droit CREATEDB pour les migrations)
createdb jeux
pnpm db:migrate
pnpm db:seed
```

Les variables d'environnement sont attendues dans `apps/web/.env.local`, `packages/db/.env` et `apps/realtime/.env` (gabarit : `.env.example`).

## Lancer

```bash
pnpm dev        # site web        → http://localhost:3000
pnpm dev:rt     # serveur de jeu  → http://localhost:4000
```

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

| Commande           | Effet                              |
| ------------------ | ---------------------------------- |
| `pnpm dev`         | Site web (Next.js)                 |
| `pnpm dev:rt`      | Service temps réel (Socket.IO)     |
| `pnpm build`       | Build de production                |
| `pnpm lint`        | ESLint                             |
| `pnpm typecheck`   | Vérification des types             |
| `pnpm test`        | Tests unitaires (Vitest)           |
| `pnpm test:e2e`    | Tests end-to-end (Playwright)      |
| `pnpm db:migrate`  | Migrations Prisma                  |
| `pnpm db:seed`     | Données de démo                    |
| `pnpm db:studio`   | Prisma Studio                      |

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
