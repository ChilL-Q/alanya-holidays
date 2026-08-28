import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Store,
  TrendingUp,
  ShieldCheck,
  Building,
  LogIn,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Eye,
  Package,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import {
  directoryService,
  type DirectoryClaim,
  type OwnerAnalyticsSummary,
  type CreateListingInput,
  type Business,
} from "@/api-services/directory.service";
import { MerchantHero } from "./components/MerchantHero";
import { MyListingsTab } from "./components/MyListingsTab";
import { PerformanceAnalyticsTab } from "./components/PerformanceAnalyticsTab";
import { ClaimTrackerTab } from "./components/ClaimTrackerTab";
import { MyProductsTab } from "./components/MyProductsTab";
import { SellerOrdersTab } from "./components/SellerOrdersTab";
import { UpgradeModal } from "./components/UpgradeModal";
import ListBusinessModal from "@/components/feature/ListBusinessModal";
import { logger } from "@/lib/logger";
import {
  businessApplicationsService,
  type BusinessApplication,
} from "@/api-services/business-applications.service";

export type DashboardTab =
  | "listings"
  | "products"
  | "orders"
  | "analytics"
  | "claims";

export default function MerchantDashboardPage() {
  const { user, profile, isAuthenticated, loading: authLoading } = useAuth();
  const { showToast, ToastContainer } = useToast();

  const [activeTab, setActiveTab] = useState<DashboardTab>("listings");
  const [listingsFilter, setListingsFilter] = useState<string>("all");
  const [days, setDays] = useState<number>(30);

  const [listings, setListings] = useState<Business[]>([]);
  const [claims, setClaims] = useState<DirectoryClaim[]>([]);
  const [analytics, setAnalytics] = useState<OwnerAnalyticsSummary | null>(null);

  const [dashboardLoading, setDashboardLoading] = useState<boolean>(true);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [businessApplication, setBusinessApplication] = useState<BusinessApplication | null>(null);
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null);

  // Modal States
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [draftToResume, setDraftToResume] = useState<Business | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [businessToUpgrade, setBusinessToUpgrade] = useState<Business | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!isAuthenticated && !user) return;

    setDashboardLoading(true);
    setDashboardError(null);

    try {
      const [fetchedListings, fetchedClaims] = await Promise.all([
        directoryService.getMyListings(),
        directoryService.getMyClaims(),
      ]);

      setListings(fetchedListings);
      setClaims(fetchedClaims);
    } catch (err) {
      logger.error("Failed to load merchant dashboard data:", err);
      setDashboardError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setDashboardLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchAnalytics = useCallback(async (selectedDays: number) => {
    if (!isAuthenticated && !user) return;

    setAnalyticsLoading(true);
    setAnalyticsError(null);

    try {
      const fetchedAnalytics = await directoryService.getOwnerAnalytics(selectedDays);
      setAnalytics(fetchedAnalytics);
    } catch (err) {
      logger.error("Failed to load merchant analytics:", err);
      setAnalyticsError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  }, [isAuthenticated, user]);

  const refreshDashboard = useCallback(async () => {
    await Promise.all([fetchDashboardData(), fetchAnalytics(days)]);
  }, [fetchDashboardData, fetchAnalytics, days]);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    void fetchAnalytics(days);
  }, [fetchAnalytics, days]);

  useEffect(() => {
    if (!isAuthenticated && !user) return;

    void businessApplicationsService
      .getMine()
      .then(setBusinessApplication)
      .catch((err: unknown) => {
        logger.warn("Failed to load business application status:", err);
      });
  }, [isAuthenticated, user]);

  // Determine highest tier
  const highestTier = listings.reduce<string>((highest, curr) => {
    const t = (curr as unknown as { tier?: string }).tier?.toLowerCase() || "explorer";
    if (t === "partner") return "partner";
    if (t === "signature" && highest !== "partner") return "signature";
    if (t === "voyager" && highest !== "partner" && highest !== "signature") return "voyager";
    return highest;
  }, "explorer");

  const activeCount = listings.filter((l) => {
    const s = l.status?.toLowerCase() || "approved";
    return s === "approved" || s === "active" || s === "verified" || s === "published";
  }).length;
  const draftsCount = listings.filter((l) => {
    const s = l.status?.toLowerCase();
    return s === "draft" || s === "drafts";
  }).length;

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated && !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-secondary-200/80 dark:border-slate-800 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Store className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold font-display text-secondary-900 dark:text-white">
              Merchant & Business Portal
            </h2>
            <p className="text-xs sm:text-sm text-secondary-500 dark:text-slate-400">
              Sign in with your Alanya Holidays business account to manage your listings, drafts, paid performance analytics, and claims.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              to="/login"
              state={{ from: { pathname: "/business/dashboard" } }}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Merchant Hub</span>
            </Link>
            <Link
              to="/business/register"
              className="w-full py-3 rounded-xl text-sm font-semibold bg-secondary-100 hover:bg-secondary-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-secondary-800 dark:text-slate-200 transition-colors"
            >
              Create Business Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const applicationStatusStyles = {
    pending: "bg-amber-50 text-amber-800 border-amber-200",
    approved: "bg-emerald-50 text-emerald-800 border-emerald-200",
    rejected: "bg-red-50 text-red-800 border-red-200",
    withdrawn: "bg-slate-100 text-slate-700 border-slate-300",
  } as const;

  // Handlers
  const handleOpenCreateModal = () => {
    setDraftToResume(null);
    setIsListModalOpen(true);
  };

  const handleResumeDraft = (draft: Business) => {
    setDraftToResume(draft);
    setIsListModalOpen(true);
  };

  const handleEditListing = (listing: Business) => {
    setDraftToResume(listing);
    setIsListModalOpen(true);
  };

  const handleDeleteListing = async (id: string) => {
    if (deletingListingId === id) return;

    const listingToDelete = listings.find((item) => item.id === id);
    setDeletingListingId(id);

    try {
      await directoryService.deleteListing(id);
      setListings((prev) => prev.filter((item) => item.id !== id));
      showToast(
        "Listing deleted",
        listingToDelete?.name ? `${listingToDelete.name} was removed from your dashboard.` : "The listing was removed successfully.",
        "success"
      );
    } catch (err) {
      logger.error("Failed to delete listing:", err);
      showToast(
        "Delete failed",
        err instanceof Error ? err.message : "Could not delete the listing. Please try again.",
        "error"
      );
    } finally {
      setDeletingListingId(null);
    }
  };

  const handleOpenUpgrade = (listing?: Business) => {
    setBusinessToUpgrade(listing || listings[0] || null);
    setIsUpgradeModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
      {/* R1. Standalone Top Bar & Return Navigation Strip */}
      <div className="bg-white dark:bg-slate-900 border-b border-secondary-200/80 dark:border-slate-800 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Return Action & Breadcrumbs */}
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 font-semibold text-secondary-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              title="Return to Main Site"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Return to Main Site / На главную</span>
            </Link>

            <span className="text-secondary-300 dark:text-slate-700 hidden sm:inline">|</span>

            {/* Visual Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-secondary-500 dark:text-slate-400 text-xs">
              <Link to="/" className="hover:text-secondary-800 dark:hover:text-slate-200 transition-colors">
                Alanya Holidays
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-secondary-400 dark:text-slate-600" />
              <Link to="/business/dashboard" className="hover:text-secondary-800 dark:hover:text-slate-200 transition-colors">
                Merchant Portal
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-secondary-400 dark:text-slate-600" />
              <span className="font-semibold text-secondary-900 dark:text-white" aria-current="page">
                Dashboard
              </span>
            </nav>
          </div>

          {/* Direct Action Link to Preview Live Directory */}
          <div className="flex items-center gap-3">
            <Link
              to="/explore"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-secondary-100 hover:bg-secondary-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-secondary-800 dark:text-slate-200 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-amber-500" />
              <span>👁️ Browse Live Directory / В каталог</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8">
        {/* Merchant Hero Header with actionable live stat triggers */}
        <MerchantHero
          merchantName={profile?.full_name || user?.email?.split("@")[0] || "Business Owner"}
          email={profile?.email || user?.email || ""}
          activeListingsCount={activeCount}
          draftsCount={draftsCount}
          tier={highestTier}
          onListNewBusiness={handleOpenCreateModal}
          onFilterActive={() => {
            setActiveTab("listings");
            setListingsFilter("active");
          }}
          onFilterDrafts={() => {
            setActiveTab("listings");
            setListingsFilter("draft");
          }}
          onSelectAnalytics={() => {
            setActiveTab("analytics");
          }}
        />

        {businessApplication && (
          <section
            aria-label="Business application status"
            className={`rounded-2xl border p-4 ${applicationStatusStyles[businessApplication.status]}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide">Business application</p>
                <p className="font-semibold">{businessApplication.businessName}</p>
              </div>
              <span className="rounded-full border border-current/20 px-3 py-1 text-xs font-bold capitalize">
                {businessApplication.status}
              </span>
            </div>
            {businessApplication.status === "rejected" && businessApplication.rejectionReason && (
              <p className="mt-2 text-sm">{businessApplication.rejectionReason}</p>
            )}
          </section>
        )}

        {dashboardError && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-sm text-rose-800 dark:text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <span>{dashboardError}</span>
            </div>
            <button
              type="button"
              onClick={() => void refreshDashboard()}
              className="text-xs font-semibold underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Dashboard Tab Navigation */}
        <div
          role="tablist"
          aria-label="Merchant Dashboard Tabs"
          className="bg-white dark:bg-slate-900 rounded-2xl p-2 sm:p-3 border border-secondary-200/80 dark:border-slate-800 shadow-sm flex flex-wrap gap-2"
        >
          {[
            {
              id: "listings" as DashboardTab,
              label: "My Businesses & Drafts",
              icon: <Building className="w-4 h-4" />,
              count: listings.length,
            },
            {
              id: "products" as DashboardTab,
              label: "My Products",
              icon: <Package className="w-4 h-4" />,
            },
            {
              id: "orders" as DashboardTab,
              label: "Incoming Orders",
              icon: <ShoppingBag className="w-4 h-4" />,
            },
            {
              id: "analytics" as DashboardTab,
              label: "Performance Analytics",
              icon: <TrendingUp className="w-4 h-4" />,
              badge: highestTier !== "explorer" ? "Active" : "Locked",
            },
            {
              id: "claims" as DashboardTab,
              label: "Ownership Claim Tracker",
              icon: <ShieldCheck className="w-4 h-4" />,
              count: claims.length,
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-initial flex items-center justify-center sm:justify-start gap-2.5 px-4 sm:px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "text-secondary-600 dark:text-slate-400 hover:text-secondary-900 dark:hover:text-white hover:bg-secondary-50 dark:hover:bg-slate-800"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-slate-950/20 text-slate-950"
                        : "bg-secondary-100 dark:bg-slate-800 text-secondary-600 dark:text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isActive
                        ? "bg-slate-950/20 text-slate-950"
                        : tab.badge === "Active"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div id={`panel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
          {activeTab === "listings" && (
            <MyListingsTab
              listings={listings}
              loading={dashboardLoading}
              filter={listingsFilter}
              onFilterChange={setListingsFilter}
              onEditListing={handleEditListing}
              onResumeDraft={handleResumeDraft}
              onDeleteListing={handleDeleteListing}
              onUpgradeTier={handleOpenUpgrade}
              onListNewBusiness={handleOpenCreateModal}
              deletingListingId={deletingListingId}
            />
          )}

          {activeTab === "analytics" && (
            <PerformanceAnalyticsTab
              analytics={analytics}
              userListings={listings}
              highestTier={highestTier}
              loading={analyticsLoading}
              error={analyticsError}
              days={days}
              onDaysChange={(newDays) => setDays(newDays)}
              onOpenUpgradeModal={() => handleOpenUpgrade()}
              onRetry={() => fetchAnalytics(days)}
            />
          )}

          {activeTab === "products" && <MyProductsTab />}

          {activeTab === "orders" && <SellerOrdersTab />}

          {activeTab === "claims" && (
            <ClaimTrackerTab claims={claims} loading={dashboardLoading} />
          )}
        </div>
      </div>

      {/* List / Resume Draft Modal */}
      {isListModalOpen && (
        <ListBusinessModal
          isOpen={isListModalOpen}
          onClose={() => {
            setIsListModalOpen(false);
            setDraftToResume(null);
            void refreshDashboard();
          }}
          draftId={draftToResume?.id}
          initialData={
            draftToResume
              ? ({
                  name: draftToResume.name,
                  category: draftToResume.category,
                  subcategory: draftToResume.subcategory,
                  description: draftToResume.description,
                  address: draftToResume.address,
                  phone: draftToResume.phone,
                  email: draftToResume.email,
                  website: draftToResume.website,
                  tier: ((draftToResume as unknown as { tier?: string }).tier as CreateListingInput["tier"]) || "explorer",
                  price_level: draftToResume.priceRange,
                  images: draftToResume.image ? [draftToResume.image] : [],
                } as Partial<CreateListingInput>)
              : undefined
          }
          userId={user?.id}
          onListingCreated={() => {
            setIsListModalOpen(false);
            setDraftToResume(null);
            void refreshDashboard();
          }}
          onDraftSaved={() => {
            setIsListModalOpen(false);
            setDraftToResume(null);
            void refreshDashboard();
          }}
        />
      )}

      <ToastContainer />

      {/* Tier Upgrade Modal */}
      {isUpgradeModalOpen && (
        <UpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          businessName={businessToUpgrade?.name || listings[0]?.name || "Your Business"}
          currentTier={(businessToUpgrade as unknown as { tier?: string })?.tier || highestTier}
        />
      )}
    </div>
  );
}
