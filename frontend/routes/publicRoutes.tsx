import React from 'react';
import { Route } from 'react-router-dom';

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
const BlogPostPage = React.lazy(() => import('../modules/blog').then(module => ({ default: module.BlogPostPage })));
const BlogPage = React.lazy(() => import('../modules/blog').then(module => ({ default: module.BlogPage })));
const BlogSubmissionSuccess = React.lazy(() => import('../modules/blog').then(module => ({ default: module.BlogSubmissionSuccess })));
const VisaConsult = React.lazy(() => import('../pages/VisaConsult').then(module => ({ default: module.VisaConsult })));
const CarRental = React.lazy(() => import('../pages/CarRental').then(module => ({ default: module.CarRental })));
const CarModelDetails = React.lazy(() => import('../pages/CarModelDetails').then(module => ({ default: module.CarModelDetails })));
const BikeRental = React.lazy(() => import('../pages/BikeRental').then(module => ({ default: module.BikeRental })));
const BicycleRental = React.lazy(() => import('../pages/BicycleRental').then(module => ({ default: module.BicycleRental })));
const Visa = React.lazy(() => import('../pages/Visa').then(module => ({ default: module.Visa })));
const ZeroFeesPage = React.lazy(() => import('../pages/ZeroFeesPage').then(module => ({ default: module.ZeroFeesPage })));
const ExperienceCategoryPage = React.lazy(() => import('../pages/ExperienceCategoryPage').then(module => ({ default: module.ExperienceCategoryPage })));
const Shop = React.lazy(() => import('../pages/Shop').then(module => ({ default: module.Shop })));
const CreativeServices = React.lazy(() => import('../pages/CreativeServices').then(module => ({ default: module.CreativeServices })));
const ListingTiersPage = React.lazy(() => import('../pages/ListingTiersPage').then(module => ({ default: module.ListingTiersPage })));
const VerifyClaimPage = React.lazy(() => import('../pages/VerifyClaimPage').then(module => ({ default: module.VerifyClaimPage })));
const HiddenGemsPage = React.lazy(() => import('../modules/blog').then(module => ({ default: module.HiddenGemsPage })));
const BestBeachesPage = React.lazy(() => import('../modules/blog').then(module => ({ default: module.BestBeachesPage })));
const BlogCategoryPage = React.lazy(() => import('../modules/blog').then(module => ({ default: module.BlogCategoryPage })));
const ForumHome = React.lazy(() => import('../modules/forum').then(module => ({ default: module.ForumHome })));
const ForumCategoryPage = React.lazy(() => import('../modules/forum').then(module => ({ default: module.ForumCategoryPage })));
const ForumPostPage = React.lazy(() => import('../modules/forum').then(module => ({ default: module.ForumPostPage })));
const EventsPage = React.lazy(() => import('../pages/EventsPage').then(module => ({ default: module.EventsPage })));
const MembersPage = React.lazy(() => import('../pages/MembersPage').then(module => ({ default: module.MembersPage })));

export const PublicRoutes: React.FC = () => (
    <>
        <Route path="/itinerary/:id" element={<SharedItineraryPage />} />
        <Route path="/list-property" element={<ListProperty />} />
        <Route path="/list-business" element={<ListingTiersPage />} />
        <Route path="/search-results" element={<SearchResultsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/stays" element={<SearchResultsPage />} />
        <Route path="/property/:id" element={<PropertyDetails />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/submission-success" element={<BlogSubmissionSuccess />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/blog/category/:category" element={<BlogCategoryPage />} />
        <Route path="/hidden-gems-alanya" element={<HiddenGemsPage />} />
        <Route path="/best-beaches-alanya" element={<BestBeachesPage />} />

        {/* Forum */}
        <Route path="/forum" element={<ForumHome />} />
        <Route path="/forum/category/:slug" element={<ForumCategoryPage />} />
        <Route path="/forum/:slug" element={<ForumPostPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/members" element={<MembersPage />} />

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
        <Route path="/verify-claim" element={<VerifyClaimPage />} />
    </>
);
