import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import AdminTabsNav, { type AdminTab } from "./components/AdminTabsNav";
import ListingsModerationTab from "./components/ListingsModerationTab";
import ClaimsQueueTab from "./components/ClaimsQueueTab";
import ContentModerationTab from "./components/ContentModerationTab";
import PlatformAnalyticsTab from "./components/PlatformAnalyticsTab";
import ConciergeTab from "./components/ConciergeTab";
import { adminService } from "@/api-services/admin.service";

export default function AdminDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab: AdminTab =
    rawTab === "claims" || rawTab === "content" || rawTab === "analytics" || rawTab === "concierge"
      ? (rawTab as AdminTab)
      : "listings";

  const [counts, setCounts] = useState<{
    pendingListings?: number;
    pendingClaims?: number;
    pendingContent?: number;
    newEnquiries?: number;
  }>({});

  const handleTabChange = (tab: AdminTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    });
  };

  const fetchGlobalBadgeCounts = useCallback(async () => {
    try {
      const [listings, claims, contentSubmissions, enquiries] = await Promise.all([
        adminService.getModerationListings({ status: "pending" }),
        adminService.getClaimsQueue("pending"),
        adminService.getContentSubmissions({ status: "pending_review" }),
        adminService.getEnquiries(),
      ]);

      const pendingListings = (listings || []).length;
      const pendingClaims = (claims || []).length;
      const pendingContent = (contentSubmissions || []).length;
      const newEnquiries = (enquiries || []).filter((e) => e.status === "new").length;

      setCounts({
        pendingListings,
        pendingClaims,
        pendingContent,
        newEnquiries,
      });
    } catch {
      // Non-blocking background sync
    }
  }, []);

  useEffect(() => {
    fetchGlobalBadgeCounts();
  }, [fetchGlobalBadgeCounts]);

  const handleListingCountUpdate = useCallback((c: { total: number; pending: number }) => {
    setCounts((prev) => (prev.pendingListings === c.pending ? prev : { ...prev, pendingListings: c.pending }));
  }, []);

  const handleClaimCountUpdate = useCallback((c: { total: number; pending: number }) => {
    setCounts((prev) => (prev.pendingClaims === c.pending ? prev : { ...prev, pendingClaims: c.pending }));
  }, []);

  const handleContentCountUpdate = useCallback((c: { total: number; pending: number }) => {
    setCounts((prev) => (prev.pendingContent === c.pending ? prev : { ...prev, pendingContent: c.pending }));
  }, []);

  const handleEnquiriesCountUpdate = useCallback((c: { total: number; newCount: number }) => {
    setCounts((prev) => (prev.newEnquiries === c.newCount ? prev : { ...prev, newEnquiries: c.newCount }));
  }, []);

  return (
    <div className="min-h-screen bg-secondary-50/50 dark:bg-slate-950 text-secondary-900 dark:text-white flex flex-col font-sans transition-colors duration-200">
      <Navbar />

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
                onClick={fetchGlobalBadgeCounts}
                className="px-3.5 py-2 text-xs font-semibold text-secondary-700 dark:text-slate-200 bg-secondary-100 dark:bg-slate-800 hover:bg-secondary-200 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700 rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
                title="Refresh badge counts"
              >
                <i className="ri-refresh-line" />
                <span>Refresh Hub</span>
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