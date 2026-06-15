import { getTranslations } from "next-intl/server";
import { prisma } from "@jeux/db";
import { initLocale } from "@/lib/locale";
import { formatPrice } from "@/lib/money";
import { updateProduct } from "@/lib/admin-actions";
import { Reveal } from "@/components/Reveal";
import { inputField } from "@/lib/ui";
import { CreateProductForm } from "./CreateProductForm";
import { DeleteProductButton } from "./DeleteProductButton";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminProductsPage({ params }: Props) {
  const locale = await initLocale(params);
  const t = await getTranslations("admin");

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "asc" },
    include: { translations: { where: { locale: "fr" } } },
  });

  return (
    <div>
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {t("productsTitle")}
            </h1>
            <p className="mt-2 text-ink-soft">{t("productsSubtitle")}</p>
          </div>
          <CreateProductForm
            labels={{
              create: t("productCreate"),
              cancel: t("cancel"),
              slug: t("colSlug"),
              nameFr: t("nameFr"),
              nameEn: t("nameEn"),
              price: t("colPrice"),
              stock: t("colStock"),
              submit: t("productCreate"),
            }}
          />
        </div>
      </Reveal>

      {products.length === 0 ? (
        <p className="mt-12 text-ink-soft">{t("productsEmpty")}</p>
      ) : (
        <Reveal dir="up" delay={80}>
          <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white/70 shadow-[0_1px_2px_rgba(33,26,19,0.04)]">
            <div className="hidden grid-cols-[1.6fr_1fr_1fr_0.8fr_auto] gap-4 border-b border-line px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft lg:grid">
              <span>{t("colName")}</span>
              <span>{t("colPrice")}</span>
              <span>{t("colStock")}</span>
              <span>{t("colActive")}</span>
              <span className="text-right">{t("colActions")}</span>
            </div>

            <ul className="divide-y divide-line">
              {products.map((product) => {
                const name = product.translations[0]?.name ?? product.slug;
                return (
                  <li key={product.id} className="px-6 py-4">
                    <div className="grid items-center gap-4 lg:grid-cols-[1.6fr_1fr_1fr_0.8fr_auto]">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{name}</p>
                        <p className="truncate text-xs text-ink-soft">{product.slug}</p>
                      </div>

                      <form
                        action={updateProduct}
                        id={`form-${product.id}`}
                        className="contents"
                      >
                        <input type="hidden" name="id" value={product.id} />

                        <label className="block">
                          <span className="mb-1 block text-xs font-medium text-ink-soft lg:hidden">
                            {t("colPrice")}
                          </span>
                          <input
                            name="price"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={(product.priceCents / 100).toFixed(2)}
                            className={inputField}
                          />
                        </label>

                        <label className="block">
                          <span className="mb-1 block text-xs font-medium text-ink-soft lg:hidden">
                            {t("colStock")}
                          </span>
                          <input
                            name="stock"
                            type="number"
                            step="1"
                            min="0"
                            defaultValue={product.stock}
                            className={inputField}
                          />
                        </label>

                        <label className="flex items-center gap-2 text-sm text-ink">
                          <input
                            name="active"
                            type="checkbox"
                            defaultChecked={product.active}
                            className="h-4 w-4 rounded border-line text-clay accent-clay"
                          />
                          <span className="lg:hidden">{t("colActive")}</span>
                        </label>
                      </form>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="submit"
                          form={`form-${product.id}`}
                          className="rounded-full bg-ink px-3.5 py-2 text-sm font-semibold text-cream transition hover:-translate-y-0.5 hover:bg-clay"
                        >
                          {t("save")}
                        </button>
                        <DeleteProductButton
                          id={product.id}
                          label={t("delete")}
                          confirmText={t("confirmDelete")}
                        />
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-ink-soft/70 lg:hidden">
                      {formatPrice(product.priceCents, product.currency, locale)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </Reveal>
      )}
    </div>
  );
}
