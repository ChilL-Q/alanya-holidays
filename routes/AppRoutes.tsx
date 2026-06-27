import React from 'react';
import { Routes, Route } from 'react-router-dom';

import { AuthRoute } from '../components/auth/AuthRoute';

// Lazy-loaded layout and guard components (only needed on admin/host/404 routes)
const AdminLayout = React.lazy(() => import('../components/layouts/AdminLayout').then(m => ({ default: m.AdminLayout })));
const HostLayoutController = React.lazy(() => import('../components/layouts/HostLayoutController').then(m => ({ default: m.HostLayoutController })));
const AdminRoute = React.lazy(() => import('../components/auth/AdminRoute').then(m => ({ default: m.AdminRoute })));
const HostRoute = React.lazy(() => import('../components/auth/HostRoute').then(m => ({ default: m.HostRoute })));
const NotFound = React.lazy(() => import('../components/pages/NotFound').then(m => ({ default: m.NotFound })));

// Public Pages - Direct Imports (critical for immediate FCP)
const DirectoryHome = React.lazy(() => import('../pages/DirectoryHome').then(module => ({ default: module.DirectoryHome })));
const DirectoryCategoryPage = React.lazy(() => import('../pages/DirectoryCategoryPage').then(module => ({ default: module.DirectoryCategoryPage })));
const ExcursionTypePage = React.lazy(() => import('../pages/ExcursionTypePage').then(module => ({ default: module.ExcursionTypePage })));
const AttractionPage = React.lazy(() => import('../pages/AttractionPage').then(module => ({ default: module.AttractionPage })));
const DistrictPage = React.lazy(() => import('../pages/DistrictPage').then(module => ({ default: module.DistrictPage })));
const SeasonalPage = React.lazy(() => import('../pages/SeasonalPage').then(module => ({ default: module.SeasonalPage })));
const NationalityLandingPage = React.lazy(() => import('../pages/NationalityLandingPage').then(module => ({ default: module.NationalityLandingPage })));
const LoginRedirect = React.lazy(() => import('../pages/auth/LoginRedirect').then(module => ({ default: module.LoginRedirect })));

// Public Pages - Lazy Loaded
const AiPlanner = React.lazy(() => import('../pages/AiPlanner').then(module => ({ default: module.AiPlanner })));
const MyItinerariesPage = React.lazy(() => import('../pages/MyItinerariesPage').then(module => ({ default: module.MyItinerariesPage })));
const SharedItineraryPage = React.lazy(() => import('../pages/SharedItineraryPage').then(module => ({ default: module.SharedItineraryPage })));
const SearchResultsPage = React.lazy(() => import('../pages/SearchResultsPage').then(module => ({ default: module.SearchResultsPage })));
const SearchPage = React.lazy(() => import('../pages/SearchPage').then(module => ({ default: module.SearchPage })));
const ServicesPage = React.lazy(() => import('../pages/ServicesPage').then(module => ({ default: module.ServicesPage })));
const About = React.lazy(() => import('../pages/About').then(module => ({ default: module.About })));
const Contact = React.lazy(() => import('../pages/Contact').then(module => ({ default: module.Contact })));
const FAQ = React.lazy(() => import('../pages/FAQ').then(module => ({ default: module.FAQ })));
const CommunityPage = React.lazy(() => import('../pages/CommunityPage').then(module => ({ default: module.CommunityPage })));
const Privacy = React.lazy(() => import('../pages/Privacy').then(module => ({ default: module.Privacy })));
const Terms = React.lazy(() => import('../pages/Terms').then(module => ({ default: module.Terms })));
const Esim = React.lazy(() => import('../pages/Esim').then(module => ({ default: module.Esim })));
const ListProperty = React.lazy(() => import('../pages/ListProperty').then(module => ({ default: module.ListProperty })));
const PropertyDetails = React.lazy(() => import('../pages/PropertyDetails').then(module => ({ default: module.PropertyDetails })));
const BlogPostPage = React.lazy(() => import('../pages/BlogPostPage').then(module => ({ default: module.BlogPostPage })));
const BlogPage = React.lazy(() => import('../pages/BlogPage').then(module => ({ default: module.BlogPage })));
const BlogSubmitPage = React.lazy(() => import('../pages/BlogSubmitPage').then(module => ({ default: module.BlogSubmitPage })));
const BlogSubmissionSuccess = React.lazy(() => import('../pages/BlogSubmissionSuccess').then(module => ({ default: module.BlogSubmissionSuccess })));
const VisaConsult = React.lazy(() => import('../pages/VisaConsult').then(module => ({ default: module.VisaConsult })));
const CarRental = React.lazy(() => import('../pages/CarRental').then(module => ({ default: module.CarRental })));
const CarModelDetails = React.lazy(() => import('../pages/CarModelDetails').then(module => ({ default: module.CarModelDetails })));
const BikeRental = React.lazy(() => import('../pages/BikeRental').then(module => ({ default: module.BikeRental })));
const BicycleRental = React.lazy(() => import('../pages/BicycleRental').then(module => ({ default: module.BicycleRental })));
const Visa = React.lazy(() => import('../pages/Visa').then(module => ({ default: module.Visa })));
const Checkout = React.lazy(() => import('../pages/Checkout').then(module => ({ default: module.Checkout })));
const ZeroFeesPage = React.lazy(() => import('../pages/ZeroFeesPage').then(module => ({ default: module.ZeroFeesPage })));
const FavoritesPage = React.lazy(() => import('../pages/FavoritesPage').then(module => ({ default: module.FavoritesPage })));
const ExperienceCategoryPage = React.lazy(() => import('../pages/ExperienceCategoryPage').then(module => ({ default: module.ExperienceCategoryPage })));
const AddService = React.lazy(() => import('../pages/AddService').then(module => ({ default: module.AddService })));
const Shop = React.lazy(() => import('../pages/Shop').then(module => ({ default: module.Shop })));
const AddProduct = React.lazy(() => import('../pages/AddProduct').then(module => ({ default: module.AddProduct })));
const Profile = React.lazy(() => import('../pages/Profile').then(module => ({ default: module.Profile })));
const BookVehicle = React.lazy(() => import('../pages/booking/BookVehicle').then(module => ({ default: module.BookVehicle })));
const BookTour = React.lazy(() => import('../pages/booking/BookTour').then(module => ({ default: module.BookTour })));
const BookWellness = React.lazy(() => import('../pages/booking/BookWellness').then(module => ({ default: module.BookWellness })));
const BookingSuccess = React.lazy(() => import('../pages/booking/Success').then(module => ({ default: module.BookingSuccess })));
const InboxPage = React.lazy(() => import('../pages/InboxPage').then(module => ({ default: module.InboxPage })));
const CreativeServices = React.lazy(() => import('../pages/CreativeServices').then(module => ({ default: module.CreativeServices })));
const ListingTiersPage = React.lazy(() => import('../pages/ListingTiersPage').then(module => ({ default: module.ListingTiersPage })));
const SubscribePage = React.lazy(() => import('../pages/SubscribePage').then(module => ({ default: module.SubscribePage })));
const VerifyClaimPage = React.lazy(() => import('../pages/VerifyClaimPage').then(module => ({ default: module.VerifyClaimPage })));
const AddListingPage = React.lazy(() => import('../pages/AddListingPage').then(module => ({ default: module.AddListingPage })));
const DirectoryListingPage = React.lazy(() => import('../pages/DirectoryListingPage').then(module => ({ default: module.DirectoryListingPage })));
const HiddenGemsPage = React.lazy(() => import('../pages/blog/HiddenGemsPage').then(module => ({ default: module.HiddenGemsPage })));
const BestBeachesPage = React.lazy(() => import('../pages/blog/BestBeachesPage').then(module => ({ default: module.BestBeachesPage })));
const BlogCategoryPage = React.lazy(() => import('../pages/blog/BlogCategoryPage').then(module => ({ default: module.BlogCategoryPage })));
const ForumHome = React.lazy(() => import('../pages/ForumHome').then(module => ({ default: module.ForumHome })));
const ForumCategoryPage = React.lazy(() => import('../pages/ForumCategoryPage').then(module => ({ default: module.ForumCategoryPage })));
const ForumPostPage = React.lazy(() => import('../pages/ForumPostPage').then(module => ({ default: module.ForumPostPage })));
const ForumSubmitPage = React.lazy(() => import('../pages/ForumSubmitPage').then(module => ({ default: module.ForumSubmitPage })));
const EventsPage = React.lazy(() => import('../pages/EventsPage').then(module => ({ default: module.EventsPage })));
const MembersPage = React.lazy(() => import('../pages/MembersPage').then(module => ({ default: module.MembersPage })));

// Lazy Load Admin Pages
const AdminEditPropertyPage = React.lazy(() => import('../pages/admin/AdminEditPropertyPage').then(module => ({ default: module.AdminEditPropertyPage })));
const AdminEditUserPage = React.lazy(() => import('../pages/admin/AdminEditUserPage').then(module => ({ default: module.AdminEditUserPage })));
const AdminEditServicePage = React.lazy(() => import('../pages/admin/AdminEditServicePage').then(module => ({ default: module.AdminEditServicePage })));
const Dashboard = React.lazy(() => import('../pages/admin/Dashboard').then(module => ({ default: module.Dashboard })));
const BookingsPage = React.lazy(() => import('../pages/admin/BookingsPage').then(module => ({ default: module.BookingsPage })));
const PropertiesPage = React.lazy(() => import('../pages/admin/PropertiesPage').then(module => ({ default: module.PropertiesPage })));
const UsersPage = React.lazy(() => import('../pages/admin/UsersPage').then(module => ({ default: module.UsersPage })));
const AdminServicesPage = React.lazy(() => import('../pages/admin/ServicesPage').then(module => ({ default: module.ServicesPage })));
const ReportsPage = React.lazy(() => import('../pages/admin/ReportsPage').then(module => ({ default: module.ReportsPage })));
const ReviewsAdminPage = React.lazy(() => import('../pages/admin/ReviewsAdminPage').then(module => ({ default: module.ReviewsAdminPage })));
const AdminProductsPage = React.lazy(() => import('../pages/admin/ProductsPage').then(module => ({ default: module.ProductsPage })));
const AdminEditProductPage = React.lazy(() => import('../pages/admin/AdminEditProductPage').then(module => ({ default: module.AdminEditProductPage })));
const DirectoryAdminPage = React.lazy(() => import('../pages/admin/DirectoryAdminPage').then(module => ({ default: module.DirectoryAdminPage })));
const AdminEditDirectoryPage = React.lazy(() => import('../pages/admin/AdminEditDirectoryPage').then(module => ({ default: module.AdminEditDirectoryPage })));
const AdminBlogSubmissionsPage = React.lazy(() => import('../pages/admin/AdminBlogSubmissionsPage').then(module => ({ default: module.AdminBlogSubmissionsPage })));
const AdminAddBlogPostPage = React.lazy(() => import('../pages/admin/AdminAddBlogPostPage').then(module => ({ default: module.AdminAddBlogPostPage })));
const AdminTestimonialsPage = React.lazy(() => import('../pages/admin/AdminTestimonialsPage').then(module => ({ default: module.AdminTestimonialsPage })));
const AdminListingReviewsPage = React.lazy(() => import('../pages/admin/AdminListingReviewsPage').then(module => ({ default: module.AdminListingReviewsPage })));
const AdminForumPage = React.lazy(() => import('../pages/admin/AdminForumPage').then(module => ({ default: module.AdminForumPage })));
const AdminEventsPage = React.lazy(() => import('../pages/admin/AdminEventsPage').then(module => ({ default: module.AdminEventsPage })));

// Lazy Load Host Pages
const HostDashboard = React.lazy(() => import('../pages/host/HostDashboard').then(module => ({ default: module.HostDashboard })));
const HostPropertiesPage = React.lazy(() => import('../pages/host/HostPropertiesPage').then(module => ({ default: module.HostPropertiesPage })));
const HostServicesPage = React.lazy(() => import('../pages/host/HostServicesPage').then(module => ({ default: module.HostServicesPage })));
const HostEditServicePage = React.lazy(() => import('../pages/host/HostEditServicePage').then(module => ({ default: module.HostEditServicePage })));
const HostBookingsPage = React.lazy(() => import('../pages/host/HostBookingsPage').then(module => ({ default: module.HostBookingsPage })));
const HostCalendarPage = React.lazy(() => import('../pages/host/HostCalendarPage').then(module => ({ default: module.HostCalendarPage })));
const HostMessagesPage = React.lazy(() => import('../pages/host/HostMessagesPage').then(module => ({ default: module.HostMessagesPage })));
const DirectoryAnalyticsPage = React.lazy(() => import('../pages/host/DirectoryAnalyticsPage').then(module => ({ default: module.DirectoryAnalyticsPage })));
const HostUpgradesPage = React.lazy(() => import('../pages/host/HostUpgradesPage').then(module => ({ default: module.HostUpgradesPage })));


export const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<DirectoryHome />} />
                <Route path="/ai-planner" element={<AuthRoute><AiPlanner /></AuthRoute>} />
                <Route path="/my-itineraries" element={<AuthRoute><MyItinerariesPage /></AuthRoute>} />
                <Route path="/itinerary/:id" element={<SharedItineraryPage />} />

                {/* SEO-Optimized Directory Category Routes */}
                <Route path="/medical-tourism-alanya" element={<DirectoryCategoryPage categoryId="medical" />} />
                <Route path="/alanya-hotels" element={<DirectoryCategoryPage categoryId="accommodations" />} />
                <Route path="/alanya-villas" element={<DirectoryCategoryPage categoryId="villas" />} />
                <Route path="/alanya-apartments" element={<DirectoryCategoryPage categoryId="apartments" />} />
                <Route path="/things-to-do-in-alanya" element={<DirectoryCategoryPage categoryId="tours" />} />
                <Route path="/airport-transfer" element={<DirectoryCategoryPage categoryId="transport" />} />
                <Route path="/car-rental" element={<DirectoryCategoryPage categoryId="transport" />} />
                <Route path="/restaurants" element={<DirectoryCategoryPage categoryId="restaurants" />} />
                <Route path="/cafes" element={<DirectoryCategoryPage categoryId="cafes" />} />
                <Route path="/alanya-real-estate" element={<DirectoryCategoryPage categoryId="real-estate" />} />
                <Route path="/alanya-residency-guide" element={<DirectoryCategoryPage categoryId="visa" />} />
                <Route path="/alanya-shopping-guide" element={<DirectoryCategoryPage categoryId="shopping" />} />
                <Route path="/alanya-nature-attractions" element={<DirectoryCategoryPage categoryId="nature" />} />
                <Route path="/alanya-weather" element={<DirectoryCategoryPage categoryId="weather" />} />
                <Route path="/nightlife" element={<DirectoryCategoryPage categoryId="nightlife" />} />
                <Route path="/alanya-spa-hamam" element={<DirectoryCategoryPage categoryId="spa-hamam" />} />
                <Route path="/alanya-hair-beauty" element={<DirectoryCategoryPage categoryId="hair-beauty" />} />

                {/* Excursion Type Pages */}
                <Route path="/alanya-boat-tours" element={<ExcursionTypePage />} />
                <Route path="/alanya-jeep-safari" element={<ExcursionTypePage />} />
                <Route path="/alanya-buggy-safari" element={<ExcursionTypePage />} />
                <Route path="/alanya-rafting" element={<ExcursionTypePage />} />
                <Route path="/scuba-diving-alanya" element={<ExcursionTypePage />} />
                <Route path="/sapadere-canyon-tour" element={<ExcursionTypePage />} />
                <Route path="/green-canyon-tour" element={<ExcursionTypePage />} />
                <Route path="/parasailing-alanya" element={<ExcursionTypePage />} />
                <Route path="/alanya-fishing-trips" element={<ExcursionTypePage />} />
                <Route path="/alanya-city-tour" element={<ExcursionTypePage />} />
                <Route path="/alanya-yacht-charter" element={<ExcursionTypePage />} />

                {/* Attraction Pages */}
                <Route path="/cleopatra-beach" element={<AttractionPage />} />
                <Route path="/incekum-beach" element={<AttractionPage />} />
                <Route path="/keykubat-beach" element={<AttractionPage />} />
                <Route path="/dim-cave" element={<AttractionPage />} />
                <Route path="/dim-river" element={<AttractionPage />} />
                <Route path="/sapadere-canyon" element={<AttractionPage />} />
                <Route path="/alanya-castle" element={<AttractionPage />} />
                <Route path="/red-tower-alanya" element={<AttractionPage />} />
                <Route path="/alanya-shipyard" element={<AttractionPage />} />
                <Route path="/syedra-ancient-city" element={<AttractionPage />} />
                <Route path="/manavgat-waterfall" element={<AttractionPage />} />
                <Route path="/side-day-trip" element={<AttractionPage />} />
                <Route path="/green-canyon" element={<AttractionPage />} />

                {/* District Pages — 9 districts × 5 page types = 45 routes */}
                <Route path="/hotels-in-mahmutlar" element={<DistrictPage />} />
                <Route path="/hotels-in-kargicak" element={<DistrictPage />} />
                <Route path="/hotels-in-oba" element={<DistrictPage />} />
                <Route path="/hotels-in-tosmur" element={<DistrictPage />} />
                <Route path="/hotels-in-konakli" element={<DistrictPage />} />
                <Route path="/hotels-in-avsallar" element={<DistrictPage />} />
                <Route path="/hotels-in-turkler" element={<DistrictPage />} />
                <Route path="/hotels-in-okurcalar" element={<DistrictPage />} />
                <Route path="/hotels-in-incekum" element={<DistrictPage />} />
                <Route path="/villas-in-mahmutlar" element={<DistrictPage />} />
                <Route path="/villas-in-kargicak" element={<DistrictPage />} />
                <Route path="/villas-in-oba" element={<DistrictPage />} />
                <Route path="/villas-in-tosmur" element={<DistrictPage />} />
                <Route path="/villas-in-konakli" element={<DistrictPage />} />
                <Route path="/villas-in-avsallar" element={<DistrictPage />} />
                <Route path="/villas-in-turkler" element={<DistrictPage />} />
                <Route path="/villas-in-okurcalar" element={<DistrictPage />} />
                <Route path="/villas-in-incekum" element={<DistrictPage />} />
                <Route path="/apartments-in-mahmutlar" element={<DistrictPage />} />
                <Route path="/apartments-in-kargicak" element={<DistrictPage />} />
                <Route path="/apartments-in-oba" element={<DistrictPage />} />
                <Route path="/apartments-in-tosmur" element={<DistrictPage />} />
                <Route path="/apartments-in-konakli" element={<DistrictPage />} />
                <Route path="/apartments-in-avsallar" element={<DistrictPage />} />
                <Route path="/apartments-in-turkler" element={<DistrictPage />} />
                <Route path="/apartments-in-okurcalar" element={<DistrictPage />} />
                <Route path="/apartments-in-incekum" element={<DistrictPage />} />
                <Route path="/things-to-do-in-mahmutlar" element={<DistrictPage />} />
                <Route path="/things-to-do-in-kargicak" element={<DistrictPage />} />
                <Route path="/things-to-do-in-oba" element={<DistrictPage />} />
                <Route path="/things-to-do-in-tosmur" element={<DistrictPage />} />
                <Route path="/things-to-do-in-konakli" element={<DistrictPage />} />
                <Route path="/things-to-do-in-avsallar" element={<DistrictPage />} />
                <Route path="/things-to-do-in-turkler" element={<DistrictPage />} />
                <Route path="/things-to-do-in-okurcalar" element={<DistrictPage />} />
                <Route path="/things-to-do-in-incekum" element={<DistrictPage />} />
                <Route path="/airport-transfer-to-mahmutlar" element={<DistrictPage />} />
                <Route path="/airport-transfer-to-kargicak" element={<DistrictPage />} />
                <Route path="/airport-transfer-to-oba" element={<DistrictPage />} />
                <Route path="/airport-transfer-to-tosmur" element={<DistrictPage />} />
                <Route path="/airport-transfer-to-konakli" element={<DistrictPage />} />
                <Route path="/airport-transfer-to-avsallar" element={<DistrictPage />} />
                <Route path="/airport-transfer-to-turkler" element={<DistrictPage />} />
                <Route path="/airport-transfer-to-okurcalar" element={<DistrictPage />} />
                <Route path="/airport-transfer-to-incekum" element={<DistrictPage />} />

                {/* Seasonal Pages — 13 routes */}
                <Route path="/alanya-in-april" element={<SeasonalPage />} />
                <Route path="/alanya-in-may" element={<SeasonalPage />} />
                <Route path="/alanya-in-june" element={<SeasonalPage />} />
                <Route path="/alanya-in-july" element={<SeasonalPage />} />
                <Route path="/alanya-in-august" element={<SeasonalPage />} />
                <Route path="/alanya-in-september" element={<SeasonalPage />} />
                <Route path="/alanya-in-october" element={<SeasonalPage />} />
                <Route path="/alanya-in-november" element={<SeasonalPage />} />
                <Route path="/alanya-in-december" element={<SeasonalPage />} />
                <Route path="/alanya-in-january" element={<SeasonalPage />} />
                <Route path="/alanya-summer-holidays" element={<SeasonalPage />} />
                <Route path="/alanya-winter-holiday" element={<SeasonalPage />} />
                <Route path="/best-time-to-visit-alanya" element={<SeasonalPage />} />

                {/* Nationality Landing Pages — 8 routes */}
                <Route path="/alanya-holidays-from-uk" element={<NationalityLandingPage />} />
                <Route path="/alanya-holidays-from-london" element={<NationalityLandingPage />} />
                <Route path="/alanya-package-holidays-uk" element={<NationalityLandingPage />} />
                <Route path="/alanya-urlaub" element={<NationalityLandingPage />} />
                <Route path="/alanya-reisen" element={<NationalityLandingPage />} />
                <Route path="/alanya-vakantie" element={<NationalityLandingPage />} />
                <Route path="/alanya-holidays-from-norway" element={<NationalityLandingPage />} />
                <Route path="/alanya-holidays-from-sweden" element={<NationalityLandingPage />} />

                {/* SEO-003: Listing Detail Routes (silo sub-pages) */}
                <Route path="/medical-tourism-alanya/:slug" element={<DirectoryListingPage categoryId="medical" />} />
                <Route path="/alanya-hotels/:slug" element={<DirectoryListingPage categoryId="accommodations" />} />
                <Route path="/alanya-villas/:slug" element={<DirectoryListingPage categoryId="villas" />} />
                <Route path="/alanya-apartments/:slug" element={<DirectoryListingPage categoryId="apartments" />} />
                <Route path="/things-to-do-in-alanya/:slug" element={<DirectoryListingPage categoryId="tours" />} />
                <Route path="/airport-transfer/:slug" element={<DirectoryListingPage categoryId="transport" />} />
                <Route path="/car-rental/:slug" element={<DirectoryListingPage categoryId="transport" />} />
                <Route path="/restaurants/:slug" element={<DirectoryListingPage categoryId="restaurants" />} />
                <Route path="/cafes/:slug" element={<DirectoryListingPage categoryId="cafes" />} />
                <Route path="/alanya-real-estate/:slug" element={<DirectoryListingPage categoryId="real-estate" />} />
                <Route path="/alanya-residency-guide/:slug" element={<DirectoryListingPage categoryId="visa" />} />
                <Route path="/alanya-shopping-guide/:slug" element={<DirectoryListingPage categoryId="shopping" />} />
                <Route path="/alanya-nature-attractions/:slug" element={<DirectoryListingPage categoryId="nature" />} />
                <Route path="/alanya-weather/:slug" element={<DirectoryListingPage categoryId="weather" />} />
                <Route path="/nightlife/:slug" element={<DirectoryListingPage categoryId="nightlife" />} />
                <Route path="/alanya-spa-hamam/:slug" element={<DirectoryListingPage categoryId="spa-hamam" />} />
                <Route path="/alanya-hair-beauty/:slug" element={<DirectoryListingPage categoryId="hair-beauty" />} />

                <Route path="/list-property" element={<ListProperty />} />
                <Route path="/list-business" element={<ListingTiersPage />} />
                <Route path="/subscribe" element={<AuthRoute><SubscribePage /></AuthRoute>} />
                <Route path="/add-listing" element={<AuthRoute><AddListingPage /></AuthRoute>} />

                <Route path="/search-results" element={<SearchResultsPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/stays" element={<SearchResultsPage />} />
                <Route path="/favorites" element={<AuthRoute><FavoritesPage /></AuthRoute>} />
                <Route path="/property/:id" element={<PropertyDetails />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/submit" element={<AuthRoute><BlogSubmitPage /></AuthRoute>} />
                <Route path="/blog/submission-success" element={<BlogSubmissionSuccess />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/blog/category/:category" element={<BlogCategoryPage />} />
                <Route path="/hidden-gems-alanya" element={<HiddenGemsPage />} />
                <Route path="/best-beaches-alanya" element={<BestBeachesPage />} />

                {/* Forum */}
                <Route path="/forum" element={<ForumHome />} />
                <Route path="/forum/new" element={<AuthRoute><ForumSubmitPage /></AuthRoute>} />
                <Route path="/forum/category/:slug" element={<ForumCategoryPage />} />
                <Route path="/forum/:slug" element={<ForumPostPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/members" element={<MembersPage />} />

                {/* Auth Redirects */}
                <Route path="/login" element={<LoginRedirect mode="login" />} />
                <Route path="/register" element={<LoginRedirect mode="register" />} />

                <Route path="/checkout" element={<AuthRoute><Checkout /></AuthRoute>} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/services/:category" element={<ServicesPage />} />
                <Route path="/zero-fees" element={<ZeroFeesPage />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/visa-consult" element={<VisaConsult />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/experiences/:category" element={<ExperienceCategoryPage />} />
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/help" element={<FAQ />} />
                <Route path="/support" element={<Contact />} />
                <Route path="/services/car-rental" element={<CarRental />} />
                <Route path="/services/car-rental/:modelId" element={<CarModelDetails />} />
                <Route path="/services/bike-rental" element={<BikeRental />} />
                <Route path="/services/bicycle-rental" element={<BicycleRental />} />
                <Route path="/services/tourist-sim-card" element={<Esim />} />
                <Route path="/services/visa-legal" element={<Visa />} />
                <Route path="/creative-professionals/:subcategory" element={<CreativeServices />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/profile" element={<AuthRoute><Profile /></AuthRoute>} />
                <Route path="/add-service" element={
                    <HostRoute>
                        <AddService />
                    </HostRoute>
                } />
                <Route path="/bookmarks" element={<AuthRoute><FavoritesPage /></AuthRoute>} />
                <Route path="/book-vehicle/:id" element={<AuthRoute><BookVehicle /></AuthRoute>} />
                <Route path="/book-tour/:id" element={<AuthRoute><BookTour /></AuthRoute>} />
                <Route path="/book-wellness/:id" element={<AuthRoute><BookWellness /></AuthRoute>} />
                <Route path="/inbox" element={<AuthRoute><InboxPage /></AuthRoute>} />

                {/* Host Routes - Protected */}
                <Route path="/booking/success" element={<AuthRoute><BookingSuccess /></AuthRoute>} />
                <Route path="/host" element={
                    <HostRoute>
                        <HostLayoutController>
                            <HostDashboard />
                        </HostLayoutController>
                    </HostRoute>
                } />
                <Route path="/host/properties" element={
                    <HostRoute>
                        <HostLayoutController>
                            <HostPropertiesPage />
                        </HostLayoutController>
                    </HostRoute>
                } />
                <Route path="/host/fleet" element={
                    <HostRoute>
                        <HostLayoutController>
                            <HostServicesPage mode="fleet" />
                        </HostLayoutController>
                    </HostRoute>
                } />
                <Route path="/host/services" element={
                    <HostRoute>
                        <HostLayoutController>
                            <HostServicesPage mode="services" />
                        </HostLayoutController>
                    </HostRoute>
                } />
                <Route path="/host/edit-service/:id" element={
                    <HostRoute>
                        <HostLayoutController>
                            <HostEditServicePage />
                        </HostLayoutController>
                    </HostRoute>
                } />
                <Route path="/host/edit-property/:id" element={
                    <HostRoute>
                        <HostLayoutController>
                            <AdminEditPropertyPage />
                        </HostLayoutController>
                    </HostRoute>
                } />
                <Route path="/host/bookings" element={
                    <HostRoute>
                        <HostLayoutController>
                            <HostBookingsPage />
                        </HostLayoutController>
                    </HostRoute>
                } />
                <Route path="/host/calendar" element={
                    <HostRoute>
                        <HostLayoutController>
                            <HostCalendarPage />
                        </HostLayoutController>
                    </HostRoute>
                } />
                <Route path="/host/dashboard" element={
                    <HostRoute>
                        <HostLayoutController>
                            <HostDashboard />
                        </HostLayoutController>
                    </HostRoute>
                } />
                <Route path="/host/messages" element={
                    <HostRoute>
                        <HostLayoutController>
                            <HostMessagesPage />
                        </HostLayoutController>
                    </HostRoute>
                } />
                <Route path="/host/directory-analytics" element={
                    <HostRoute>
                        <HostLayoutController>
                            <DirectoryAnalyticsPage />
                        </HostLayoutController>
                    </HostRoute>
                } />
                <Route path="/host/upgrades" element={
                    <HostRoute>
                        <HostLayoutController>
                            <HostUpgradesPage />
                        </HostLayoutController>
                    </HostRoute>
                } />

                {/* Admin Routes Protected by AdminRoute */}
                <Route path="/admin" element={
                    <AdminRoute>
                        <AdminLayout>
                            <Dashboard />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/bookings" element={
                    <AdminRoute>
                        <AdminLayout>
                            <BookingsPage />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/properties" element={
                    <AdminRoute>
                        <AdminLayout>
                            <PropertiesPage />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/users" element={
                    <AdminRoute>
                        <AdminLayout>
                            <UsersPage />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/fleet" element={
                    <AdminRoute>
                        <AdminLayout>
                            <AdminServicesPage type="fleet" />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/services" element={
                    <AdminRoute>
                        <AdminLayout>
                            <AdminServicesPage type="services" />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/reports" element={
                    <AdminRoute>
                        <AdminLayout>
                            <ReportsPage />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/reviews" element={
                    <AdminRoute>
                        <AdminLayout>
                            <ReviewsAdminPage />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/listing-reviews" element={
                    <AdminRoute>
                        <AdminLayout>
                            <AdminListingReviewsPage />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/products" element={
                    <AdminRoute>
                        <AdminLayout>
                            <AdminProductsPage />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/products/:id" element={
                    <AdminRoute>
                        <AdminLayout>
                            <AdminEditProductPage />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/directory" element={
                    <AdminRoute>
                        <AdminLayout>
                            <DirectoryAdminPage />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/directory/:id" element={
                    <AdminRoute>
                        <AdminLayout>
                            <AdminEditDirectoryPage />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/blog-submissions" element={
                    <AdminRoute>
                        <AdminLayout>
                            <AdminBlogSubmissionsPage />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/blog-submissions/new" element={
                    <AdminRoute>
                        <AdminLayout>
                            <AdminAddBlogPostPage />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/testimonials" element={
                    <AdminRoute>
                        <AdminLayout>
                            <AdminTestimonialsPage />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/forum" element={
                    <AdminRoute>
                        <AdminLayout>
                            <AdminForumPage />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/events" element={
                    <AdminRoute>
                        <AdminLayout>
                            <AdminEventsPage />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/restaurants" element={
                    <AdminRoute>
                        <AdminLayout>
                            <DirectoryAdminPage defaultCategory="restaurants" />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/cafes" element={
                    <AdminRoute>
                        <AdminLayout>
                            <DirectoryAdminPage defaultCategory="cafes" />
                        </AdminLayout>
                    </AdminRoute>
                } />

                {/* Edit Routes (Wrapped in Layout) */}
                <Route path="/admin/edit-property/:id" element={
                    <AdminRoute>
                        <AdminLayout>
                            <AdminEditPropertyPage />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/edit-user/:id" element={
                    <AdminRoute>
                        <AdminLayout>
                            <AdminEditUserPage />
                        </AdminLayout>
                    </AdminRoute>
                } />
                <Route path="/admin/edit-service/:id" element={
                    <AdminRoute>
                        <AdminLayout>
                            <AdminEditServicePage />
                        </AdminLayout>
                    </AdminRoute>
                } />

                <Route path="/add-product" element={
                    <HostRoute>
                        <AddProduct />
                    </HostRoute>
                } />

                <Route path="/verify-claim" element={<VerifyClaimPage />} />

                <Route path="*" element={<NotFound />} />
            </Routes>
    );
};
