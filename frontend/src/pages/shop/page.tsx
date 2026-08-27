import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import PageHeroImage from "@/components/base/PageHeroImage";
import { ErrorState } from "@/components/base/ErrorState";
import PersonalShopperForm from "@/pages/shop/components/PersonalShopperForm";
import RecentEnquiriesSidebar from "@/pages/shop/components/RecentEnquiriesSidebar";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import {
  productsService,
  type ShopProduct,
  type ProductCategory as Category,
} from "@/api-services/products.service";

export default function ShopPage() {
  const { addToCart } = useCart();
  const { showToast, ToastContainer } = useToast();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await productsService.getShopCatalog();
      setProducts(data.products);
      setCategories(data.categories);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await productsService.getShopCatalog();

        if (!cancelled) {
          setProducts(data.products);
          setCategories(data.categories);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load products");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = activeCategory === null
    ? products
    : products.filter((p) => p.category_id === activeCategory);

  const formatPrice = (product: ShopProduct) => {
    const symbol = product.currency === "EUR" ? "€" : product.currency === "USD" ? "$" : product.currency;
    return `${symbol}${product.price.toFixed(2)}`;
  };

  const getCategoryTag = (product: ShopProduct) => {
    const catName = product.product_categories?.name || "";
    if (catName === "Food & Treats") return "Edible";
    if (catName === "AlanyaHolidays Merch") return "Exclusive";
    if (catName === "Books & Learning") return "Digital";
    if (catName === "Travel Essentials") return "Popular";
    if (catName === "Turkish Home & Decor") return "Handmade";
    if (catName === "Turkish Textiles") return "Artisan";
    if (catName === "Gift Cards") return "Gift";
    return "New";
  };

  const getCategoryIcon = (product: ShopProduct) => {
    const catName = product.product_categories?.name || "";
    if (catName === "Turkish Home & Decor") return "ri-home-smile-line";
    if (catName === "Turkish Textiles") return "ri-t-shirt-line";
    if (catName === "Food & Treats") return "ri-cake-line";
    if (catName === "AlanyaHolidays Merch") return "ri-vip-crown-line";
    if (catName === "Books & Learning") return "ri-book-open-line";
    if (catName === "Travel Essentials") return "ri-suitcase-line";
    if (catName === "Gift Cards") return "ri-gift-line";
    return "ri-store-2-line";
  };

  const handleAddToCart = useCallback(
    (product: ShopProduct) => {
      addToCart({
        name: product.name,
        price: formatPrice(product),
        icon: getCategoryIcon(product),
      });
      showToast("Added to cart", product.name, "success");
    },
    [addToCart, showToast],
  );

  return (
    <>
      <Navbar />
      <main>
        <section className="relative w-full h-[280px] md:h-[380px] overflow-hidden">
          <PageHeroImage
            page="shop"
            alt="Alanya Holidays Shop"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/55 via-foreground-950/30 to-foreground-950/75"></div>

          <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-10 md:pb-14">
            <div className="flex items-center gap-2 mb-4">
              <Link
                to="/"
                className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2"
              >
                Home
              </Link>
              <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
              <span className="text-white/90 text-sm">Shop</span>
            </div>
            <h1 className="font-heading text-3xl md:text-5xl text-white mb-2">Forum Shop</h1>
            <p className="text-white/70 text-sm md:text-base max-w-xl">
              Authentic Turkish goods, community merch, and travel essentials — every purchase supports the AlanyaHolidays community.
            </p>
          </div>
        </section>

        <section className="w-full px-4 md:px-8 lg:px-12 py-16 md:py-24 bg-background-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground-200 bg-white mb-6">
                <i className="ri-store-2-line text-accent-500 text-sm"></i>
                <span className="text-sm font-medium text-foreground-700">Community Shop</span>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl text-foreground-900 mb-4">All Products</h2>
              <p className="text-foreground-500 text-sm md:text-base max-w-xl mx-auto">
                Every purchase helps keep AlanyaHolidays running — from server costs to community events.
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Main product area */}
              <div className="flex-1 min-w-0">

            {/* Category Filter Tabs */}
            {!loading && !error && categories.length > 0 && (
              <div className="flex items-center justify-center gap-1.5 mb-10 overflow-x-auto pb-1 flex-wrap">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    activeCategory === null
                      ? "bg-primary-500 text-background-50"
                      : "bg-white text-foreground-600 border border-background-200 hover:border-foreground-300 hover:text-foreground-900"
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      activeCategory === cat.id
                        ? "bg-primary-500 text-background-50"
                        : "bg-white text-foreground-600 border border-background-200 hover:border-foreground-300 hover:text-foreground-900"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-background-200 border-t-accent-500 rounded-full animate-spin"></div>
                <p className="text-foreground-500 text-sm">Loading products...</p>
              </div>
            )}

            {error && !loading && (
              <ErrorState
                title="Unable to load shop catalog"
                message={error}
                onRetry={loadCatalog}
                className="py-20"
              />
            )}

            {!loading && !error && filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-background-100 mx-auto mb-4">
                  <i className="ri-store-2-line text-foreground-300 text-2xl"></i>
                </div>
                <p className="text-foreground-500 text-sm">No products in this category yet.</p>
                <button
                  onClick={() => setActiveCategory(null)}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-background-50 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-arrow-left-line"></i>
                  Show All Products
                </button>
              </div>
            )}

            {!loading && !error && filteredProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6" data-product-shop>
                {filteredProducts.map((product) => (
                  <Link
                    to={`/shop/${product.id}`}
                    key={product.id}
                    className="bg-white rounded-2xl overflow-hidden border border-background-200/70 hover:border-primary-200/60 transition-all group cursor-pointer flex flex-col"
                  >
                    <div className="relative w-full aspect-square overflow-hidden bg-background-100">
                      {product.media && product.media.length > 0 && product.media[0]?.url ? (
                        <img
                          src={product.media[0].url}
                          alt={product.name}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <i className={`${getCategoryIcon(product)} text-foreground-300 text-4xl`}></i>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/90 text-foreground-800 text-xs font-medium whitespace-nowrap shadow-sm backdrop-blur-sm">
                          {getCategoryTag(product)}
                        </span>
                        {product.variant_count && (
                          <span className="px-2 py-0.5 rounded-full bg-accent-500/90 text-white text-xs font-medium whitespace-nowrap shadow-sm backdrop-blur-sm">
                            {product.variant_count} {getCategoryTag(product) === "Exclusive" ? "sizes" : getCategoryTag(product) === "Gift" ? "tiers" : "options"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 md:p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-foreground-400">
                          {product.product_categories?.name || "General"}
                        </span>
                      </div>
                      <h3 className="font-heading text-base text-foreground-900 mb-2 leading-snug">
                        {product.name}
                      </h3>
                      <p className="text-sm text-foreground-500 leading-relaxed mb-4 line-clamp-3 flex-1">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-background-100">
                        <span className="text-lg font-semibold text-primary-600 whitespace-nowrap">
                          {formatPrice(product)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-background-50 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          Add to Cart
                          <i className="ri-shopping-cart-line text-sm"></i>
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Smooth scroll CTA to Personal Shopper */}
            {!loading && !error && filteredProducts.length > 0 && (
              <div className="text-center mt-10">
                <a
                  href="#personal-shopper"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("personal-shopper")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-search-eye-line text-sm"></i>
                  Didn't find it? Let us source it for you
                  <i className="ri-arrow-down-line text-sm"></i>
                </a>
              </div>
            )}
              </div>{/* close flex-1 */}
              <RecentEnquiriesSidebar />
            </div>{/* close flex row */}
          </div>{/* close max-w-7xl */}
        </section>

        {/* Personal Shopper Concierge Service */}
        <PersonalShopperForm />
      </main>
      <Footer />
      <ToastContainer />
    </>
  );
}