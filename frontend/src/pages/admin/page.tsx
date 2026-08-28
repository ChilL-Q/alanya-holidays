import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import { useAuth } from "@/context/AuthContext";
import AdminTabsNav, { type AdminTab } from "./components/AdminTabsNav";
import ListingsModerationTab from "./components/ListingsModerationTab";
import ClaimsQueueTab from "./components/ClaimsQueueTab";
import ContentModerationTab from "./components/ContentModerationTab";
import ForumModerationTab from "./components/ForumModerationTab";
import AuditLogTab from "./components/AuditLogTab";
import PlatformAnalyticsTab from "./components/PlatformAnalyticsTab";
import ConciergeTab from "./components/ConciergeTab";
import BookingsAdminTab from "./components/BookingsAdminTab";
import ReviewsModerationTab from "./components/ReviewsModerationTab";
import UsersAdminTab from "./components/UsersAdminTab";
import BusinessApplicationsTab from "./components/BusinessApplicationsTab";
import { adminService } from "@/api-services/admin.service";
import { useToast } from "@/hooks/useToast";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

export default function AdminDashboardPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab: AdminTab =
    rawTab === "claims" ||
    rawTab === "business-applications" ||
    rawTab === "content" ||
    rawTab === "forum" ||
    rawTab === "bookings" ||
    rawTab === "reviews" ||
    rawTab === "users" ||
    rawTab === "audit" ||
    rawTab === "analytics" ||
    rawTab === "concierge"
      ? (rawTab as AdminTab)
      : "listings";


  const [counts, setCounts] = useState<{
    pendingListings?: number;
    pendingClaims?: number;
    pendingContent?: number;
    pendingReports?: number;
    pendingBookings?: number;
    pendingReviews?: number;
    newEnquiries?: number;
  }>({});

  const handleTabChange = (tab: AdminTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    });
  };

  const fetchGlobalBadgeCounts = useCallback(async (manual: boolean = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const [listings, claims, contentSubmissions, reports, enquiries, bookings, reviews] = await Promise.all([
        adminService.getModerationListings({ status: "pending", throwOnError: true }),
        adminService.getClaimsQueue("pending", { throwOnError: true }),
        adminService.getContentSubmissions({ status: "pending_review", throwOnError: true }),
        adminService.getForumReports({ includeResolved: false, throwOnError: true }),
        adminService.getEnquiries({ throwOnError: true }),
        adminService.getAdminBookings("pending", { throwOnError: true }),
        adminService.getModerationReviews("pending", 1, 1, { throwOnError: true }),
      ]);

      setCounts({
        pendingListings: (listings || []).length,
        pendingClaims: (claims || []).length,
        pendingContent: (contentSubmissions || []).length,
        pendingReports: (reports || []).filter((r) => !r.resolved).length,
        newEnquiries: (enquiries || []).filter((e) => e.status === "new").length,
        pendingBookings: bookings.length,
        pendingReviews: reviews.total,
      });

      if (manual) {
        showToast("Hub Refreshed", "Badge counts are up to date", "success");
      }
    } catch {
      // Non-blocking background sync
      if (manual) {
        showToast("Refresh Failed", "Could not sync some badge counts", "error");
      }
    } finally {
      if (manual) setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchGlobalBadgeCounts(false);
  }, [fetchGlobalBadgeCounts]);

  useAutoRefresh(() => fetchGlobalBadgeCounts(false), {
    enabled: isAdmin && !authLoading,
    intervalMs: 30000,
  });

  const handleListingCountUpdate = useCallback((c: { total: number; pending: number }) => {
    setCounts((prev) => (prev.pendingListings === c.pending ? prev : { ...prev, pendingListings: c.pending }));
  }, []);

  const handleClaimCountUpdate = useCallback((c: { total: number; pending: number }) => {
    setCounts((prev) => (prev.pendingClaims === c.pending ? prev : { ...prev, pendingClaims: c.pending }));
  }, []);

  const handleContentCountUpdate = useCallback((c: { total: number; pending: number }) => {
    setCounts((prev) => (prev.pendingContent === c.pending ? prev : { ...prev, pendingContent: c.pending }));
  }, []);

  const handleReportCountUpdate = useCallback((c: { total: number; pending: number }) => {
    setCounts((prev) => (prev.pendingReports === c.pending ? prev : { ...prev, pendingReports: c.pending }));
  }, []);

  const handleEnquiriesCountUpdate = useCallback((c: { total: number; newCount: number }) => {
    setCounts((prev) => (prev.newEnquiries === c.newCount ? prev : { ...prev, newEnquiries: c.newCount }));
  }, []);

  // Stable identities are required: the tabs include onCountUpdate in their
  // fetch-effect deps, and inline arrows would retrigger fetching forever.
  const handleBookingsCountUpdate = useCallback((c: { total: number; pending: number }) => {
    setCounts((prev) => (prev.pendingBookings === c.pending ? prev : { ...prev, pendingBookings: c.pending }));
  }, []);

  const handleReviewsCountUpdate = useCallback((c: { total: number; pending: number }) => {
    setCounts((prev) => (prev.pendingReviews === c.pending ? prev : { ...prev, pendingReviews: c.pending }));
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-accent-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-secondary-200/80 dark:border-slate-800 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto text-3xl">
            <i className="ri-shield-keyhole-line" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold font-display text-secondary-900 dark:text-white">
              Access Restricted
            </h2>
            <p className="text-xs sm:text-sm text-secondary-500 dark:text-slate-400">
              This control center is available to platform administrators only.
            </p>
          </div>
          <Link
            to="/"
            className="inline-block px-6 py-3 rounded-xl text-sm font-semibold bg-secondary-100 dark:bg-slate-800 hover:bg-secondary-200 dark:hover:bg-slate-700 text-secondary-900 dark:text-white transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50/50 dark:bg-slate-950 text-secondary-900 dark:text-white flex flex-col font-sans transition-colors duration-200">
      <Navbar />
      <ToastContainer />

      {/* Admin Hub Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-secondary-200 dark:border-slate-800 pt-24 pb-6 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent-600 text-white flex items-center justify-center text-lg shadow-xs">
                  <i className="ri-shield-star-line" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-secondary-900 dark:text-white tracking-tight">
                  Admin Hub & Platform Control Center
                </h1>
              </div>
              <p className="text-sm text-secondary-500 dark:text-slate-400 mt-1 pl-11">
                Manage listing submissions, verify business ownership claims, track traffic analytics, and triage VIP concierge enquiries.
              </p>
            </div>

            <div className="flex items-center space-x-3 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => fetchGlobalBadgeCounts(true)}
                disabled={isRefreshing}
                className={`px-3.5 py-2 text-xs font-semibold text-secondary-700 dark:text-slate-200 bg-secondary-100 dark:bg-slate-800 hover:bg-secondary-200 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700 rounded-xl transition-colors flex items-center space-x-1.5 ${isRefreshing ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                title="Refresh badge counts"
              >
                <i className={`ri-refresh-line ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh Hub'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Tab Navigation */}
      <AdminTabsNav
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        counts={counts}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "listings" && (
          <div
            id="admin-tabpanel-listings"
            role="tabpanel"
            aria-labelledby="admin-tab-listings"
          >
            <ListingsModerationTab
              onListingCountUpdate={handleListingCountUpdate}
            />
          </div>
        )}

        {activeTab === "claims" && (
          <div
            id="admin-tabpanel-claims"
            role="tabpanel"
            aria-labelledby="admin-tab-claims"
          >
            <ClaimsQueueTab
              onClaimCountUpdate={handleClaimCountUpdate}
            />
          </div>
        )}

        {activeTab === "business-applications" && (
          <div
            id="admin-tabpanel-business-applications"
            role="tabpanel"
            aria-labelledby="admin-tab-business-applications"
          >
            <BusinessApplicationsTab />
          </div>
        )}

        {activeTab === "content" && (
          <div
            id="admin-tabpanel-content"
            role="tabpanel"
            aria-labelledby="admin-tab-content"
          >
            <ContentModerationTab
              onContentCountUpdate={handleContentCountUpdate}
            />
          </div>
        )}

        {activeTab === "forum" && (
          <div
            id="admin-tabpanel-forum"
            role="tabpanel"
            aria-labelledby="admin-tab-forum"
          >
            <ForumModerationTab
              onReportCountUpdate={handleReportCountUpdate}
            />
          </div>
        )}

        {activeTab === "bookings" && (
          <div
            id="admin-tabpanel-bookings"
            role="tabpanel"
            aria-labelledby="admin-tab-bookings"
          >
            <BookingsAdminTab onCountUpdate={handleBookingsCountUpdate} />
          </div>
        )}

        {activeTab === "reviews" && (
          <div
            id="admin-tabpanel-reviews"
            role="tabpanel"
            aria-labelledby="admin-tab-reviews"
          >
            <ReviewsModerationTab onCountUpdate={handleReviewsCountUpdate} />
          </div>
        )}

        {activeTab === "users" && (
          <div
            id="admin-tabpanel-users"
            role="tabpanel"
            aria-labelledby="admin-tab-users"
          >
            <UsersAdminTab />
          </div>
        )}

        {activeTab === "audit" && (
          <div
            id="admin-tabpanel-audit"
            role="tabpanel"
            aria-labelledby="admin-tab-audit"
          >
            <AuditLogTab />
          </div>
        )}

        {activeTab === "analytics" && (
          <div
            id="admin-tabpanel-analytics"
            role="tabpanel"
            aria-labelledby="admin-tab-analytics"
          >
            <PlatformAnalyticsTab />
          </div>
        )}

        {activeTab === "concierge" && (
          <div
            id="admin-tabpanel-concierge"
            role="tabpanel"
            aria-labelledby="admin-tab-concierge"
          >
            <ConciergeTab
              onEnquiriesCountUpdate={handleEnquiriesCountUpdate}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}