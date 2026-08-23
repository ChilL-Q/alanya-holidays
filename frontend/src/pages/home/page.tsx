import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import HeroSection from "./components/HeroSection";
import PopularNow from "./components/PopularNow";
import WelcomeSection from "./components/WelcomeSection";
import TrendingThreads from "./components/TrendingThreads";
import CategoriesGrid from "./components/CategoriesGrid";
import FeaturedProducts from "./components/FeaturedProducts";
import RecentlyClaimedSection from "./components/RecentlyClaimedSection";
import CommunityPulse from "./components/CommunityPulse";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";

export default function Home() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t("home.title", "Alanya Holidays | Community for Travelers & Locals");
  }, [t]);

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar />
      <main>
        <HeroSection />
        <PopularNow />
        <RecentlyClaimedSection />
        <WelcomeSection />
        <TrendingThreads />
        <CategoriesGrid />
        <FeaturedProducts />
        <CommunityPulse />
      </main>
      <Footer />
    </div>
  );
}