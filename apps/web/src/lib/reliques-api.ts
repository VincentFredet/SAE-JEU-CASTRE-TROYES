import { z } from "zod";

// Client typé pour l'API partenaire (backend Symfony / API Platform de Théo).
// JSON-LD / Hydra : les collections renvoient { member: [...], totalItems }.
// Base configurable via RELIQUES_API_URL (voir .env.example).
const API_BASE = (process.env.RELIQUES_API_URL ?? "https://reliques.theo-gambier.fr/api").replace(
  /\/$/,
  "",
);

const LD_JSON = "application/ld+json";

export class ReliquesApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    readonly body = "",
  ) {
    super(`Reliques API ${status} on ${path}${body ? `: ${body.slice(0, 200)}` : ""}`);
    this.name = "ReliquesApiError";
  }
}

type FetchOpts = { token?: string; revalidate?: number; signal?: AbortSignal };

async function apiFetch(path: string, init: RequestInit, opts: FetchOpts = {}): Promise<unknown> {
  const headers = new Headers(init.headers);
  headers.set("Accept", LD_JSON);
  if (opts.token) headers.set("Authorization", `Bearer ${opts.token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    signal: opts.signal,
    // Données publiques peu changeantes → cache ISR côté serveur.
    next: { revalidate: opts.revalidate ?? 300 },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ReliquesApiError(res.status, path, body);
  }
  return res.status === 204 ? null : res.json();
}

const apiGet = (path: string, opts?: FetchOpts) => apiFetch(path, { method: "GET" }, opts);

// Une collection Hydra : { member: [...] } (nouvelle clé) ou { "hydra:member": [...] }.
function membersOf(payload: unknown): unknown[] {
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const list = obj.member ?? obj["hydra:member"];
    if (Array.isArray(list)) return list;
  }
  return [];
}

// Parse chaque membre indépendamment : un item malformé est ignoré, pas toute la liste.
function parseCollection<T>(payload: unknown, schema: z.ZodType<T>): T[] {
  const out: T[] = [];
  for (const raw of membersOf(payload)) {
    const r = schema.safeParse(raw);
    if (r.success) out.push(r.data);
  }
  return out;
}

// Champs nullish : le backend renvoie souvent des ressources partielles.
export const shopSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string().nullish(),
  city: z.string().nullish(),
  postalCode: z.string().nullish(),
  address: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  distance: z.number().nullish(),
  totalStock: z.number().nullish(),
});
export type Shop = z.infer<typeof shopSchema>;

export const newsSchema = z.object({
  id: z.number(),
  title: z.string().nullish(),
  chapo: z.string().nullish(),
  content: z.string().nullish(),
  publishedAt: z.string().nullish(),
});
export type NewsArticle = z.infer<typeof newsSchema>;

export const eventSchema = z.object({
  id: z.number(),
  title: z.string().nullish(),
  chapo: z.string().nullish(),
  content: z.string().nullish(),
  publishedAt: z.string().nullish(),
  startDate: z.string().nullish(),
  endDate: z.string().nullish(),
  address: z.string().nullish(),
  city: z.string().nullish(),
  postalCode: z.string().nullish(),
});
export type ReliquesEvent = z.infer<typeof eventSchema>;

// Scaffold - ressources protégées par JWT. Prêtes à l'emploi dès que /api/login
// délivre un jeton (cf. login() ci-dessous). Non câblées tant que l'auth API n'existe pas.
export const productSchema = z.object({
  id: z.number(),
  title: z.string().nullish(),
  description: z.string().nullish(),
  price: z.string().nullish(),
  stock: z.number().nullish(),
  status: z.string().nullish(),
  releaseDate: z.string().nullish(),
  images: z.array(z.string()).nullish(),
});
export type ReliquesProduct = z.infer<typeof productSchema>;

// Lectures publiques (sans jeton). Dégradation douce : [] en cas d'erreur réseau/API.
async function safeCollection<T>(path: string, schema: z.ZodType<T>): Promise<T[]> {
  try {
    return parseCollection(await apiGet(path), schema);
  } catch (err) {
    console.error(`[reliques-api] GET ${path} failed:`, err);
    return [];
  }
}

// L'API localise les champs traduisibles via ?lang=fr|en (titre/description produit, etc.).
function withLang(path: string, lang?: string): string {
  if (!lang) return path;
  return `${path}${path.includes("?") ? "&" : "?"}lang=${encodeURIComponent(lang)}`;
}

export const getShops = (lang?: string) => safeCollection(withLang("/shops", lang), shopSchema);
export const getNews = (lang?: string) => safeCollection(withLang("/news", lang), newsSchema);
export const getEvents = (lang?: string) => safeCollection(withLang("/events", lang), eventSchema);

// Échange identifiants -> JWT. POST /api/login { email, password } -> { token }.
const tokenSchema = z.object({ token: z.string() });

export async function login(email: string, password: string): Promise<string> {
  const data = await apiFetch(
    "/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    },
    { revalidate: 0 },
  );
  return tokenSchema.parse(data).token;
}

// Compte de service : le serveur s'authentifie pour lire /products et créer /orders
// (ces ressources exigent un JWT). Jeton mis en cache (~50 min ; il expire à 1 h côté API).
const SERVICE_EMAIL = process.env.RELIQUES_SERVICE_EMAIL;
const SERVICE_PASSWORD = process.env.RELIQUES_SERVICE_PASSWORD;
const TOKEN_TTL_MS = 50 * 60 * 1000;
let serviceToken: { value: string; expiresAt: number } | null = null;

async function getServiceToken(force = false): Promise<string | null> {
  if (!SERVICE_EMAIL || !SERVICE_PASSWORD) return null;
  if (!force && serviceToken && serviceToken.expiresAt > Date.now()) return serviceToken.value;
  try {
    const value = await login(SERVICE_EMAIL, SERVICE_PASSWORD);
    serviceToken = { value, expiresAt: Date.now() + TOKEN_TTL_MS };
    return value;
  } catch (err) {
    console.error("[reliques-api] service login failed:", err);
    serviceToken = null;
    return null;
  }
}

// GET authentifié, avec un seul retry si le jeton de service a expiré (401).
async function serviceGet(path: string): Promise<unknown> {
  const token = await getServiceToken();
  if (!token) throw new ReliquesApiError(401, path, "no service credentials");
  try {
    return await apiGet(path, { token, revalidate: 0 });
  } catch (err) {
    if (err instanceof ReliquesApiError && err.status === 401) {
      const fresh = await getServiceToken(true);
      if (fresh) return apiGet(path, { token: fresh, revalidate: 0 });
    }
    throw err;
  }
}

export async function getProducts(lang?: string): Promise<ReliquesProduct[]> {
  try {
    return parseCollection(await serviceGet(withLang("/products", lang)), productSchema);
  } catch (err) {
    console.error("[reliques-api] GET /products failed:", err);
    return [];
  }
}

export async function getProduct(
  id: number | string,
  lang?: string,
): Promise<ReliquesProduct | null> {
  try {
    const r = productSchema.safeParse(await serviceGet(withLang(`/products/${id}`, lang)));
    return r.success ? r.data : null;
  } catch (err) {
    console.error(`[reliques-api] GET /products/${id} failed:`, err);
    return null;
  }
}

// Création de commande - POST /api/orders (JWT requis ; les infos client sont dans le
// corps). Renvoie la commande avec son checkoutUrl Stripe (paiement géré par le backend).
export const orderInputSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive().max(99),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().email(),
  address: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(120),
  postalCode: z.string().trim().min(1).max(20),
});
export type OrderInput = z.infer<typeof orderInputSchema>;

const orderResultSchema = z.object({
  id: z.number(),
  reference: z.string().nullish(),
  totalAmount: z.string().nullish(),
  checkoutUrl: z.string().nullish(),
});
export type OrderResult = z.infer<typeof orderResultSchema>;

export async function createOrder(input: OrderInput): Promise<OrderResult> {
  const token = await getServiceToken();
  if (!token) throw new ReliquesApiError(401, "/orders", "no service credentials");
  const data = await apiFetch(
    "/orders",
    {
      method: "POST",
      headers: { "Content-Type": "application/ld+json" },
      body: JSON.stringify({
        product: `/api/products/${input.productId}`,
        quantity: input.quantity,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        address: input.address,
        city: input.city,
        postalCode: input.postalCode,
      }),
    },
    { token, revalidate: 0 },
  );
  return orderResultSchema.parse(data);
}

// Inscription - POST /api/register. 422 = champ déjà pris (email/username).
const registeredUserSchema = z.object({
  id: z.number(),
  email: z.string(),
  username: z.string(),
  roles: z.array(z.string()).default([]),
});
export type RegisteredUser = z.infer<typeof registeredUserSchema>;

export class RegisterConflictError extends Error {
  constructor(readonly field: "email" | "username" | "other") {
    super(`register conflict on ${field}`);
    this.name = "RegisterConflictError";
  }
}

export async function register(
  email: string,
  username: string,
  password: string,
): Promise<RegisteredUser> {
  try {
    const data = await apiFetch(
      "/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/ld+json" },
        body: JSON.stringify({ email, username, plainPassword: password }),
      },
      { revalidate: 0 },
    );
    return registeredUserSchema.parse(data);
  } catch (err) {
    if (err instanceof ReliquesApiError && err.status === 422) {
      throw new RegisterConflictError(violationField(err.body));
    }
    throw err;
  }
}

// Repère le champ en conflit dans une réponse ConstraintViolation d'API Platform.
function violationField(body: string): "email" | "username" | "other" {
  try {
    const paths = (JSON.parse(body)?.violations ?? []).map(
      (v: { propertyPath?: string }) => v.propertyPath,
    );
    if (paths.includes("username")) return "username";
    if (paths.includes("email")) return "email";
  } catch {
    if (/username/i.test(body)) return "username";
    if (/email/i.test(body)) return "email";
  }
  return "other";
}

// Détail d'une boutique via /shops/{id} (expose désormais totalStock + coordonnées).
export async function getShop(id: number | string, lang?: string): Promise<Shop | null> {
  try {
    const r = shopSchema.safeParse(await apiGet(withLang(`/shops/${id}`, lang)));
    return r.success ? r.data : null;
  } catch (err) {
    console.error(`[reliques-api] GET /shops/${id} failed:`, err);
    return null;
  }
}

// Click & collect - réserver un produit dans une boutique (retrait/pré-commande).
// NOTE: POST /api/click-and-collect renvoie actuellement 500 côté backend pour toutes
// les entrées, et aucun endpoint n'expose les shopProduct. À vérifier avec Théo : format
// de shopProduct + correction du 500. On envoie ici la forme dénormalisée { shop, product }.
export const cncInputSchema = z.object({
  shopId: z.number().int().positive(),
  productId: z.number().int().positive(),
  quantity: z.number().int().positive().max(99),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().email(),
  paymentChoice: z.enum(["online", "on_reception"]),
});
export type ClickCollectInput = z.infer<typeof cncInputSchema>;

const cncResultSchema = z.object({
  id: z.number(),
  reference: z.string().nullish(),
  status: z.string().nullish(),
  paymentStatus: z.string().nullish(),
  checkoutUrl: z.string().nullish(),
});
export type ClickCollectResult = z.infer<typeof cncResultSchema>;

export async function createClickAndCollect(
  input: ClickCollectInput,
): Promise<ClickCollectResult> {
  const token = await getServiceToken();
  if (!token) throw new ReliquesApiError(401, "/click-and-collect", "no service credentials");
  const data = await apiFetch(
    "/click-and-collect",
    {
      method: "POST",
      headers: { "Content-Type": "application/ld+json" },
      body: JSON.stringify({
        shopProduct: {
          shop: `/api/shops/${input.shopId}`,
          product: `/api/products/${input.productId}`,
        },
        quantity: input.quantity,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        paymentChoice: input.paymentChoice,
      }),
    },
    { token, revalidate: 0 },
  );
  return cncResultSchema.parse(data);
}

export { API_BASE };
