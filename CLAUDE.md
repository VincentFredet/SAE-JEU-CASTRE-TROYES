# CLAUDE.md

Guide pour travailler sur ce dépôt (lu par Claude Code et par l'équipe).

## Projet

Site d'un **jeu de société** (SAÉ). Trois volets :

1. **Vitrine / e-commerce** — présentation du jeu, boutique, panier, commande (Stripe plus tard).
2. **Espace joueur** — comptes, connexion, profil, **leaderboard** des scores.
3. **Jeu multijoueur en ligne** — parties en temps réel via WebSocket.

> Les **règles du jeu ne sont pas encore définies**. On construit d'abord les
> systèmes stables (auth, i18n, boutique, scores, moteur de partie générique).
> Le moteur de jeu est volontairement abstrait pour accueillir les règles ensuite.

## Architecture (monorepo pnpm)

```
apps/
  web/        Next.js 16 (App Router, TS) — vitrine, boutique, auth, leaderboard, UI du jeu
  realtime/   Service Node + Socket.IO — parties temps réel (salons, tours)
packages/
  db/         Prisma (schéma + client) — partagé par web & realtime
  shared/     Types & contrats partagés (events Socket.IO, DTO)
```

Pourquoi un service temps réel séparé : Next.js (serverless/edge) ne tient pas
des connexions WebSocket longues. On isole le jeu dans un process Node dédié.

## Stack

- **Next.js 16** + React 19 + TypeScript + **Tailwind v4**
- **next-intl** — i18n FR/EN (routage `/[locale]/…`)
- **Auth.js (NextAuth v5)** + adapter Prisma — credentials + sessions
- **Prisma 6** + **PostgreSQL 15**
- **Socket.IO** — temps réel
- **Zod** — validation des entrées
- **Vitest** (unitaire) + **Playwright** (e2e)
- **GitHub Actions** — lint + typecheck + tests + build

## Commandes (depuis la racine)

```bash
pnpm install          # installe tout le workspace
pnpm dev              # lance le site web (port 3000)
pnpm dev:rt           # lance le serveur de jeu (port 4000)
pnpm db:migrate       # applique les migrations Prisma
pnpm db:seed          # remplit la BDD avec des données de démo
pnpm db:studio        # ouvre Prisma Studio
pnpm lint             # ESLint sur tout le workspace
pnpm typecheck        # vérifie les types
pnpm test             # tests unitaires (Vitest)
pnpm test:e2e         # tests end-to-end (Playwright)
pnpm build            # build de production
```

## Conventions

- **TypeScript strict** partout. Pas de `any` non justifié.
- **Validation** de toute entrée externe (formulaires, API, events socket) avec Zod.
- **i18n** : aucun texte d'UI en dur — tout passe par `next-intl` (`useTranslations`).
- **Imports** : alias `@/…` dans `apps/web` ; packages via `@jeux/db`, `@jeux/shared`.
- **Argent** : montants stockés en **centimes (int)**, jamais en float.
- **Secrets** : uniquement via variables d'environnement (voir `.env.example`).
- **Commits** : style Conventional Commits (`feat:`, `fix:`, `chore:`…).

## Environnement

Copier `.env.example` → `.env` (et `apps/web/.env.local`, `packages/db/.env`).
PostgreSQL doit tourner en local (base `jeux`). Voir `README.md` pour le détail.
