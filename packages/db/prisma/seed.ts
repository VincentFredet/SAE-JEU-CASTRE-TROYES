import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PRODUCTS = [
  {
    slug: "jeu-base",
    priceCents: 3990,
    stock: 50,
    imageUrl: "/products/jeu-base.svg",
    translations: {
      fr: {
        name: "Le Jeu — Boîte de base",
        description: "La boîte de base du jeu : plateau, cartes et règles complètes.",
      },
      en: {
        name: "The Game — Core Box",
        description: "The core box: board, cards and the complete rulebook.",
      },
    },
  },
  {
    slug: "extension-1",
    priceCents: 1990,
    stock: 30,
    imageUrl: "/products/extension-1.svg",
    translations: {
      fr: {
        name: "Extension n°1",
        description: "Une extension qui ajoute de nouveaux modes et cartes.",
      },
      en: {
        name: "Expansion #1",
        description: "An expansion adding new modes and cards.",
      },
    },
  },
  {
    slug: "goodies-pack",
    priceCents: 990,
    stock: 100,
    imageUrl: "/products/goodies.svg",
    translations: {
      fr: { name: "Pack goodies", description: "Pions premium et sac de rangement." },
      en: { name: "Goodies pack", description: "Premium tokens and a storage bag." },
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
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { priceCents: p.priceCents, stock: p.stock, imageUrl: p.imageUrl },
      create: {
        slug: p.slug,
        priceCents: p.priceCents,
        stock: p.stock,
        imageUrl: p.imageUrl,
        translations: {
          create: [
            { locale: "fr", ...p.translations.fr },
            { locale: "en", ...p.translations.en },
          ],
        },
      },
    });
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
