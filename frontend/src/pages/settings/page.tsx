import React, { useEffect, useCallback } from "react";
import "@/i18n";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/context/AuthContext";
import { SettingsHero, type SettingsTabId } from "./components/SettingsHero";
import { ProfileTab } from "./components/ProfileTab";
import { SecurityTab } from "./components/SecurityTab";
import { ActivityTab } from "./components/ActivityTab";
import { BillingTab } from "./components/BillingTab";
import { useTranslation } from "react-i18next";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast, ToastContainer } = useToast();

  // Authentication Guard
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", {
        replace: true,
        state: { from: location },
      });
    }
  }, [loading, user, navigate, location]);

  // Tab state derived from and synced to URL search param
  const rawTab = searchParams.get("tab");
  const activeTab: SettingsTabId =
    rawTab === "security" || rawTab === "activity" || rawTab === "billing"
      ? rawTab
      : "profile";

  const handleTabChange = useCallback(
    (newTab: SettingsTabId) => {
      setSearchParams({ tab: newTab }, { replace: true });
    },
    [setSearchParams]
  );

  // Stripe checkout return: показать результат
  useEffect(() => {
    const result = searchParams.get("subscription");
    if (result === "success") {
      showToast(t("settings.subscriptionActivated", "Subscription activated! Welcome aboard 🎉"), undefined, "success");
    } else if (result === "cancelled") {
      showToast(t("settings.checkoutCancelled", "Checkout cancelled — no charge was made."), undefined, "info");
    }
    if (result) {
      searchParams.delete("subscription");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, showToast, t]);

  // Render loading skeleton while checking auth session
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main
          data-testid="settings-loading-skeleton"
          className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10"
        >
          <div className="animate-pulse space-y-8">
            <div className="h-64 bg-slate-200 rounded-2xl w-full" />
            <div className="h-96 bg-slate-200 rounded-2xl w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // If unauthenticated and redirect is in-flight, return null
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section with Avatar, Info & Tab Pills */}
        <SettingsHero
          user={user}
          profile={profile}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Tab Content Container */}
        <div className="transition-all duration-300">
          {activeTab === "profile" && (
            <ProfileTab
              profile={profile}
              onProfileUpdated={() => {
                showToast(t("settings.profileUpdatedTitle", "Profile Updated"), t("settings.profileUpdatedDescription", "Your changes have been saved to your account."), "success");
              }}
            />
          )}

          {activeTab === "security" && (
            <SecurityTab
              onPasswordUpdated={() => {
                showToast(t("settings.passwordChangedTitle", "Password Changed"), t("settings.passwordChangedDescription", "Your password was updated successfully."), "success");
              }}
            />
          )}

          {activeTab === "activity" && <ActivityTab />}
        {activeTab === "billing" && <BillingTab />}
        </div>
      </main>

      <Footer />
      <ToastContainer />
    </div>
  );
}
