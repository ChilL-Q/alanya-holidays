import React from "react";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import InsightsHero from "./components/InsightsHero";
import HeadlineStatsGrid from "./components/HeadlineStatsGrid";
import DemographicCharts from "./components/DemographicCharts";
import TourismCharts from "./components/TourismCharts";
import DistrictProfilesGrid from "./components/DistrictProfilesGrid";
import OfficialSourcesFooter from "./components/OfficialSourcesFooter";

export default function InsightsPage() {
  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-50 dark:bg-background-950 text-foreground-900 dark:text-foreground-100 antialiased selection:bg-primary-500 selection:text-white transition-colors duration-150">
      {/* Global Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Section */}
        <InsightsHero onScrollToSection={handleScrollToSection} />

        {/* 6 Headline Province Metrics */}
        <HeadlineStatsGrid />

        {/* Demographic & Expat Visualizations (Recharts Pie & Bar) */}
        <DemographicCharts />

        {/* Tourism Seasonality & Source Countries (Recharts Area & Bar) */}
        <TourismCharts />

        {/* 8 Municipal District Profile Cards & Interactive Filter */}
        <DistrictProfilesGrid />

        {/* Official Governmental & International Data Sources */}
        <OfficialSourcesFooter />
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}