import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PRODUCTS = [
  {
    slug: "jeu-base",
    priceCents: 3990,
    stock: 50,
    imageUrl: "/products/jeu-base.png",
    translations: {
      fr: {
        name: "RELIQUES - Boite de base",
        description: "La boite de base : plateau 7 lieux, pions, reliques, jetons et l'app compagnon. 4 a 5 joueurs.",
      },
      en: {
        name: "RELIQUES - Core Box",
        description: "The core box: 7-location board, pawns, relics, tokens and the companion app. 4 to 5 players.",
      },
    },
  },
  {
    slug: "extension-1",
    priceCents: 1990,
    stock: 30,
    imageUrl: "/products/extension-1.png",
    translations: {
      fr: {
        name: "RELIQUES - Le Temple Perdu",
        description: "Une extension : nouveaux lieux, nouvelles reliques et missions inedites.",
      },
      en: {
        name: "RELIQUES - The Lost Temple",
        description: "An expansion: new locations, new relics and fresh missions.",
      },
    },
  },
  {
    slug: "goodies-pack",
    priceCents: 990,
    stock: 100,
    imageUrl: "/products/goodies.png",
    translations: {
      fr: {
        name: "RELIQUES - Pack collector",
        description: "Pions premium, repliques de reliques et sac de rangement.",
      },
      en: {
        name: "RELIQUES - Collector pack",
        description: "Premium tokens, relic replicas and a storage bag.",
      },
    },
  },
];

async function main() {
  const adminHash = await bcrypt.hash("admin1234", 10);
  const playerHash = await bcrypt.hash("joueur1234", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@jeux.test" },
    update: {},
    create: {
      email: "admin@jeux.test",
      username: "admin",
      name: "Admin",
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
  });

  const player = await prisma.user.upsert({
    where: { email: "joueur@jeux.test" },
    update: {},
    create: {
      email: "joueur@jeux.test",
      username: "joueur",
      name: "Joueur démo",
      passwordHash: playerHash,
      role: Role.USER,
    },
  });

  for (const p of PRODUCTS) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: { priceCents: p.priceCents, stock: p.stock, imageUrl: p.imageUrl },
      create: { slug: p.slug, priceCents: p.priceCents, stock: p.stock, imageUrl: p.imageUrl },
      select: { id: true },
    });
    for (const locale of ["fr", "en"] as const) {
      await prisma.productTranslation.upsert({
        where: { productId_locale: { productId: product.id, locale } },
        update: p.translations[locale],
        create: { productId: product.id, locale, ...p.translations[locale] },
      });
    }
  }

  await prisma.score.deleteMany({ where: { game: "default" } });
  await prisma.score.createMany({
    data: [
      { userId: admin.id, points: 1200 },
      { userId: player.id, points: 980 },
      { userId: player.id, points: 1500 },
    ],
  });

  console.log("seed ok — admin@jeux.test/admin1234, joueur@jeux.test/joueur1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
