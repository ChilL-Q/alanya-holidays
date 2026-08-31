import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import {
  Package,
  Plus,
  Pencil,
  Check,
  X,
  AlertCircle,
  Loader2,
  Lock,
  Trash2,
  Zap,
} from "lucide-react";
import {
  productsService,
  type SellerProduct,
} from "@/api-services/products.service";
import { logger } from "@/lib/logger";
import { ApiError } from "@/lib/api-client";

interface MyProductsTabProps {
  hasPremiumAccess: boolean;
  onOpenUpgradeModal: () => void;
}

interface ProductFormState {
  name: string;
  description: string;
  price: string;
  stock: string;
}

const EMPTY_FORM: ProductFormState = { name: "", description: "", price: "", stock: "" };

const STATUS_BADGES: Record<string, string> = {
  active:
    "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
  draft:
    "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800",
  inactive:
    "bg-secondary-100 dark:bg-slate-800 text-secondary-600 dark:text-slate-400 border-secondary-200 dark:border-slate-700",
};

const getProductErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError && error.status === 401) {
    return i18n.t("merchant.sessionExpired");
  }
  if (error instanceof ApiError && error.status === 403) {
    return i18n.t("merchant.premiumRequired");
  }
  return i18n.t("merchant.productsUpdateFailed");
};

export const MyProductsTab: React.FC<MyProductsTabProps> = ({
  hasPremiumAccess,
  onOpenUpgradeModal,
}) => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [productToDelete, setProductToDelete] = useState<SellerProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await productsService.getMyProducts());
    } catch (err) {
      logger.error("Failed to load seller products:", err);
      setError(getProductErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasPremiumAccess) {
      void loadProducts();
    } else {
      setLoading(false);
      setProducts([]);
    }
  }, [hasPremiumAccess, loadProducts]);

  const openCreateForm = () => {
    setForm(EMPTY_FORM);
    setEditingId("new");
  };

  const openEditForm = (product: SellerProduct) => {
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? 0),
    });
    setEditingId(product.id);
  };

  const closeForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    const price = Number.parseFloat(form.price);
    if (!form.name.trim()) return;
    if (Number.isNaN(price) || price < 0) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price,
        currency: "EUR",
        stock: Number.parseInt(form.stock, 10) || 0,
      };

      if (editingId === "new") {
        await productsService.createMyProduct(payload);
      } else if (editingId !== null) {
        await productsService.updateMyProduct(editingId, payload);
      }
      closeForm();
      await loadProducts();
    } catch (err) {
      logger.error("Failed to save product:", err);
      setError(getProductErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete || deleting) return;
    const previousProducts = products;
    const deletedProduct = productToDelete;
    setDeleting(true);
    setProductToDelete(null);
    setProducts((current) =>
      current.filter((product) => product.id !== deletedProduct.id)
    );
    setError(null);
    try {
      await productsService.deleteMyProduct(deletedProduct.id);
    } catch (err) {
      // Roll back the optimistic removal if authorization or persistence fails.
      setProducts(previousProducts);
      setError(getProductErrorMessage(err));
      logger.error("Failed to delete product:", err);
    } finally {
      setDeleting(false);
    }
  };

  if (!hasPremiumAccess) {
    return (
      <section className="relative overflow-hidden rounded-2xl bg-slate-950 border border-amber-500/30 p-8 sm:p-12 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">{t("merchant.unlockProducts")}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-300">
          {t("merchant.productsDescription")}
        </p>
        <button
          type="button"
          onClick={onOpenUpgradeModal}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          <Zap className="h-4 w-4" />
          {t("merchant.upgradeSubscription")}
        </button>
      </section>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 animate-pulse space-y-3"
          >
            <div className="h-5 bg-secondary-200 dark:bg-slate-800 rounded-md w-1/3" />
            <div className="h-4 bg-secondary-100 dark:bg-slate-800/60 rounded-md w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-sm text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add product bar */}
      {editingId === null && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t("merchant.addProduct")}
          </button>
        </div>
      )}

      {/* Create / Edit form */}
      {editingId !== null && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 shadow-sm space-y-4">
          <h3 className="font-bold text-secondary-900 dark:text-white">
            {editingId === "new" ? t("merchant.newProduct") : t("merchant.editProduct")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-xs font-semibold text-secondary-700 dark:text-slate-300 space-y-1.5">
              {t("merchant.nameRequired")}
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t("merchant.productNamePlaceholder")}
                maxLength={120}
                className="w-full px-3 py-2.5 rounded-xl border border-secondary-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-secondary-900 dark:text-white outline-none focus:border-amber-400 transition-colors"
              />
            </label>
            <label className="text-xs font-semibold text-secondary-700 dark:text-slate-300 space-y-1.5">
              {t("merchant.priceRequired")}
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder={t("merchant.pricePlaceholder")}
                className="w-full px-3 py-2.5 rounded-xl border border-secondary-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-secondary-900 dark:text-white outline-none focus:border-amber-400 transition-colors"
              />
            </label>
            <label className="text-xs font-semibold text-secondary-700 dark:text-slate-300 space-y-1.5">
              {t("merchant.stock")}
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                placeholder={t("merchant.stockPlaceholder")}
                className="w-full px-3 py-2.5 rounded-xl border border-secondary-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-secondary-900 dark:text-white outline-none focus:border-amber-400 transition-colors"
              />
            </label>
            <label className="text-xs font-semibold text-secondary-700 dark:text-slate-300 space-y-1.5">
              {t("merchant.descriptionLabel")}
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={t("merchant.descriptionPlaceholder")}
                maxLength={500}
                className="w-full px-3 py-2.5 rounded-xl border border-secondary-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-secondary-900 dark:text-white outline-none focus:border-amber-400 transition-colors"
              />
            </label>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !form.name.trim() || Number.isNaN(Number.parseFloat(form.price))}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 transition-all cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {t("merchant.saveProduct")}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-secondary-100 hover:bg-secondary-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-secondary-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {products.length === 0 && editingId === null && (
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-bold text-secondary-900 dark:text-white">{t("merchant.noProducts")}</h3>
            <p className="text-xs sm:text-sm text-secondary-500 dark:text-slate-400">
              {t("merchant.productsEmptyDescription")}
            </p>
          </div>
        </div>
      )}

      {/* Products list */}
      <div className="space-y-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-bold text-secondary-900 dark:text-white truncate">{product.name}</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      STATUS_BADGES[product.status?.toLowerCase()] || STATUS_BADGES.inactive
                    }`}
                  >
                    {product.status}
                  </span>
                </div>
                {product.description && (
                  <p className="text-xs text-secondary-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {product.description}
                  </p>
                )}
                <p className="text-xs text-secondary-500 dark:text-slate-400 mt-1">
                  {t("merchant.stock")}: {product.stock} · {t("merchant.added")} {" "}
                  {product.created_at &&
                    new Date(product.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
              <span className="font-bold text-lg text-secondary-900 dark:text-white">
                €{Number(product.price).toFixed(2)}
              </span>
              <button
                type="button"
                onClick={() => openEditForm(product)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-secondary-100 hover:bg-secondary-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-secondary-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                {t("merchant.edit")}
              </button>
              <button
                type="button"
                onClick={() => setProductToDelete(product)}
                disabled={deleting}
                aria-label={`Delete ${product.name}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t("merchant.delete")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {productToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-product-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 id="delete-product-title" className="text-lg font-bold text-secondary-900 dark:text-white">
              {t("merchant.deleteProductQuestion")}
            </h2>
            <p className="mt-2 text-sm text-secondary-600 dark:text-slate-300">
              {t("merchant.productRemoved", { name: productToDelete.name })}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="rounded-xl bg-secondary-100 px-4 py-2 text-sm font-semibold text-secondary-800 hover:bg-secondary-200 dark:bg-slate-800 dark:text-slate-200"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
              >
                {t("merchant.deleteProduct")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
