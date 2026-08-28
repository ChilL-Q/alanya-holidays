import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import AccessRoute from "./AccessRoute";

const NotFound = lazy(() => import("../pages/NotFound"));
const Home = lazy(() => import("../pages/home/page"));
const CategoriesPage = lazy(() => import("../pages/categories/page"));
const CategoryPage = lazy(() => import("../pages/category/page"));
const EventsPage = lazy(() => import("../pages/events/page"));
const ThreadPage = lazy(() => import("../pages/thread/page"));
const NewThreadPage = lazy(() => import("../pages/new-thread/page"));
const LoginPage = lazy(() => import("../pages/login/page"));
const RegisterPage = lazy(() => import("../pages/register/page"));
const ForgotPasswordPage = lazy(() => import("../pages/forgot-password/page"));
const VerifyClaimPage = lazy(() => import("../pages/verify-claim/page"));
const AboutPage = lazy(() => import("../pages/about/page"));
const PrivacyPage = lazy(() => import("../pages/privacy/page"));
const TermsPage = lazy(() => import("../pages/terms/page"));
const HelpPage = lazy(() => import("../pages/help/page"));
const SearchPage = lazy(() => import("../pages/search/page"));
const ExplorePage = lazy(() => import("../pages/explore/page"));
const TravelGuidesPage = lazy(() => import("../pages/travel-guides/page"));
const CommunityHubPage = lazy(() => import("../pages/community-hub/page"));
const ShopPage = lazy(() => import("../pages/shop/page"));
const ProductDetailPage = lazy(() => import("../pages/product-detail/page"));
const BusinessDetailPage = lazy(() => import("../pages/business/page"));
const BusinessDashboardPage = lazy(() => import("../pages/business/dashboard/page"));
const ComparePage = lazy(() => import("../pages/compare/page"));
const ContactPage = lazy(() => import("../pages/contact/page"));
const YachtChartersPage = lazy(() => import("../pages/yacht-charters/page"));
const VillaStaysPage = lazy(() => import("../pages/villa-stays/page"));
const HelicopterToursPage = lazy(() => import("../pages/helicopter-tours/page"));
const WineTastingsPage = lazy(() => import("../pages/wine-tastings/page"));
const HammamSpaPage = lazy(() => import("../pages/hammam-spa/page"));
const PhotographyExcursionsPage = lazy(() => import("../pages/photography-excursions/page"));
const BookingConfirmationPage = lazy(() => import("../pages/booking-confirmation/page"));
const AdminDashboardPage = lazy(() => import("../pages/admin/page"));
const CheckoutPage = lazy(() => import("../pages/checkout/page"));
const GolfVacationsPage = lazy(() => import("../pages/golf-vacations/page"));
const PrivateJetsPage = lazy(() => import("../pages/private-jets/page"));
const PersonalChefsPage = lazy(() => import("../pages/personal-chefs/page"));
const PersonalDriverPage = lazy(() => import("../pages/personal-driver/page"));
const PersonalShopperPage = lazy(() => import("../pages/personal-shopper/page"));
const SettingsPage = lazy(() => import("../pages/settings/page"));
const BlogPage = lazy(() => import("../pages/blog/page"));
const BlogPostPage = lazy(() => import("../pages/blog/post/page"));
const BlogSubmitPage = lazy(() => import("../pages/blog/submit/page"));

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/explore",
    element: <ExplorePage />,
  },
  {
    path: "/villa-stays",
    element: <VillaStaysPage />,
  },
  {
    path: "/helicopter-tours",
    element: <HelicopterToursPage />,
  },
  {
    path: "/wine-tastings",
    element: <WineTastingsPage />,
  },
  {
    path: "/hammam-spa",
    element: <HammamSpaPage />,
  },
  {
    path: "/photography-excursions",
    element: <PhotographyExcursionsPage />,
  },
  {
    path: "/golf-vacations",
    element: <GolfVacationsPage />,
  },
  {
    path: "/private-jets",
    element: <PrivateJetsPage />,
  },
  {
    path: "/personal-chefs",
    element: <PersonalChefsPage />,
  },
  {
    path: "/personal-driver",
    element: <PersonalDriverPage />,
  },
  {
    path: "/personal-shopper",
    element: <PersonalShopperPage />,
  },
  {
    path: "/yacht-charters",
    element: <YachtChartersPage />,
  },
  {
    path: "/travel-guides",
    element: <TravelGuidesPage />,
  },
  {
    path: "/community-hub",
    element: <CommunityHubPage />,
  },
  {
    path: "/categories",
    element: <CategoriesPage />,
  },
  {
    path: "/category/:categoryId",
    element: <CategoryPage />,
  },
  {
    path: "/events",
    element: <EventsPage />,
  },
  {
    path: "/shop",
    element: <ShopPage />,
  },
  {
    path: "/shop/:productId",
    element: <ProductDetailPage />,
  },
  {
    path: "/checkout",
    element: <CheckoutPage />,
  },
  {
    path: "/search",
    element: <SearchPage />,
  },
  {
    path: "/about",
    element: <AboutPage />,
  },
  {
    path: "/privacy",
    element: <PrivacyPage />,
  },
  {
    path: "/terms",
    element: <TermsPage />,
  },
  {
    path: "/help",
    element: <HelpPage />,
  },
  {
    path: "/thread/:threadId",
    element: <ThreadPage />,
  },
  {
    path: "/new-thread",
    element: <NewThreadPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/verify-claim",
    element: <VerifyClaimPage />,
  },
  {
    path: "/business/dashboard",
    element: <BusinessDashboardPage />,
  },
  {
    path: "/business/:businessId",
    element: <BusinessDetailPage />,
  },
  {
    path: "/compare",
    element: <ComparePage />,
  },
  {
    path: "/contact",
    element: <ContactPage />,
  },
  {
    path: "/booking-confirmation",
    element: <BookingConfirmationPage />,
  },
  {
    path: "/admin",
    element: (
      <AccessRoute level="admin">
        <AdminDashboardPage />
      </AccessRoute>
    ),
  },
  {
    path: "/settings",
    element: <SettingsPage />,
  },
  {
    path: "/profile",
    element: <SettingsPage />,
  },
  {
    path: "/forum",
    element: <Navigate to="/categories" replace />,
  },
  {
    path: "/directory",
    element: <Navigate to="/explore" replace />,
  },
  {
    path: "/blog",
    element: <BlogPage />,
  },
  {
    path: "/blog/submit",
    element: <BlogSubmitPage />,
  },
  {
    path: "/blog/:slug",
    element: <BlogPostPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;