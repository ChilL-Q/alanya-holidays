import React from 'react';
import { Route } from 'react-router-dom';
import { AuthRoute } from '../components/auth/AuthRoute';

const AiPlanner = React.lazy(() => import('../pages/AiPlanner').then(module => ({ default: module.AiPlanner })));
const MyItinerariesPage = React.lazy(() => import('../pages/MyItinerariesPage').then(module => ({ default: module.MyItinerariesPage })));
const LoginRedirect = React.lazy(() => import('../pages/auth/LoginRedirect').then(module => ({ default: module.LoginRedirect })));
const FavoritesPage = React.lazy(() => import('../pages/FavoritesPage').then(module => ({ default: module.FavoritesPage })));
const Profile = React.lazy(() => import('../pages/Profile').then(module => ({ default: module.Profile })));
const BookVehicle = React.lazy(() => import('../pages/booking/BookVehicle').then(module => ({ default: module.BookVehicle })));
const BookTour = React.lazy(() => import('../pages/booking/BookTour').then(module => ({ default: module.BookTour })));
const BookWellness = React.lazy(() => import('../pages/booking/BookWellness').then(module => ({ default: module.BookWellness })));
const BookingSuccess = React.lazy(() => import('../pages/booking/Success').then(module => ({ default: module.BookingSuccess })));
const InboxPage = React.lazy(() => import('../pages/InboxPage').then(module => ({ default: module.InboxPage })));
const Checkout = React.lazy(() => import('../pages/Checkout').then(module => ({ default: module.Checkout })));
const SubscribePage = React.lazy(() => import('../pages/SubscribePage').then(module => ({ default: module.SubscribePage })));
const AddListingPage = React.lazy(() => import('../pages/AddListingPage').then(module => ({ default: module.AddListingPage })));
const BlogSubmitPage = React.lazy(() => import('../modules/blog').then(module => ({ default: module.BlogSubmitPage })));
const ForumSubmitPage = React.lazy(() => import('../modules/forum').then(module => ({ default: module.ForumSubmitPage })));
const ForumAskPage = React.lazy(() => import('../modules/forum').then(module => ({ default: module.ForumAskPage })));

export const AccountRoutes = (): React.ReactNode => (
    <>
        <Route path="/ai-planner" element={<AuthRoute><AiPlanner /></AuthRoute>} />
        <Route path="/my-itineraries" element={<AuthRoute><MyItinerariesPage /></AuthRoute>} />
        <Route path="/subscribe" element={<AuthRoute><SubscribePage /></AuthRoute>} />
        <Route path="/add-listing" element={<AuthRoute><AddListingPage /></AuthRoute>} />
        <Route path="/favorites" element={<AuthRoute><FavoritesPage /></AuthRoute>} />
        <Route path="/bookmarks" element={<AuthRoute><FavoritesPage /></AuthRoute>} />
        <Route path="/blog/submit" element={<AuthRoute><BlogSubmitPage /></AuthRoute>} />
        <Route path="/forum/new" element={<AuthRoute><ForumSubmitPage /></AuthRoute>} />
        <Route path="/forum/ask" element={<AuthRoute><ForumAskPage /></AuthRoute>} />
        <Route path="/checkout" element={<AuthRoute><Checkout /></AuthRoute>} />
        <Route path="/profile" element={<AuthRoute><Profile /></AuthRoute>} />
        <Route path="/book-vehicle/:id" element={<AuthRoute><BookVehicle /></AuthRoute>} />
        <Route path="/book-tour/:id" element={<AuthRoute><BookTour /></AuthRoute>} />
        <Route path="/book-wellness/:id" element={<AuthRoute><BookWellness /></AuthRoute>} />
        <Route path="/inbox" element={<AuthRoute><InboxPage /></AuthRoute>} />
        <Route path="/booking/success" element={<AuthRoute><BookingSuccess /></AuthRoute>} />

        {/* Auth Redirects */}
        <Route path="/login" element={<LoginRedirect mode="login" />} />
        <Route path="/register" element={<LoginRedirect mode="register" />} />
    </>
);
