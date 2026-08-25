import React, { useCallback, useEffect, useState } from "react";
import {
  Package,
  Plus,
  Pencil,
  Check,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  productsService,
  type SellerProduct,
} from "@/api-services/products.service";
import { logger } from "@/lib/logger";

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

export const MyProductsTab: React.FC = () => {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await productsService.getMyProducts());
    } catch (err) {
      logger.error("Failed to load seller products:", err);
      setError("Failed to load your products. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

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
      setError("Failed to save the product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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
            Add Product
          </button>
        </div>
      )}

      {/* Create / Edit form */}
      {editingId !== null && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 shadow-sm space-y-4">
          <h3 className="font-bold text-secondary-900 dark:text-white">
            {editingId === "new" ? "New Product" : "Edit Product"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-xs font-semibold text-secondary-700 dark:text-slate-300 space-y-1.5">
              Name *
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Handmade ceramic bowl"
                maxLength={120}
                className="w-full px-3 py-2.5 rounded-xl border border-secondary-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-secondary-900 dark:text-white outline-none focus:border-amber-400 transition-colors"
              />
            </label>
            <label className="text-xs font-semibold text-secondary-700 dark:text-slate-300 space-y-1.5">
              Price (EUR) *
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="24.90"
                className="w-full px-3 py-2.5 rounded-xl border border-secondary-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-secondary-900 dark:text-white outline-none focus:border-amber-400 transition-colors"
              />
            </label>
            <label className="text-xs font-semibold text-secondary-700 dark:text-slate-300 space-y-1.5">
              Stock
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                placeholder="10"
                className="w-full px-3 py-2.5 rounded-xl border border-secondary-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-secondary-900 dark:text-white outline-none focus:border-amber-400 transition-colors"
              />
            </label>
            <label className="text-xs font-semibold text-secondary-700 dark:text-slate-300 space-y-1.5">
              Description
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description shown to buyers"
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
              Save Product
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-secondary-100 hover:bg-secondary-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-secondary-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              Cancel
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
            <h3 className="text-lg font-bold text-secondary-900 dark:text-white">No products yet</h3>
            <p className="text-xs sm:text-sm text-secondary-500 dark:text-slate-400">
              Add your first product and it will appear in the Alanya Holidays shop for buyers to purchase.
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
                  Stock: {product.stock} · Added{" "}
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
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
