import React from 'react';
import { Route } from 'react-router-dom';

const DirectoryHome = React.lazy(() => import('../pages/DirectoryHome').then(module => ({ default: module.DirectoryHome })));
const DirectoryCategoryPage = React.lazy(() => import('../pages/DirectoryCategoryPage').then(module => ({ default: module.DirectoryCategoryPage })));
const ExcursionTypePage = React.lazy(() => import('../pages/ExcursionTypePage').then(module => ({ default: module.ExcursionTypePage })));
const AttractionPage = React.lazy(() => import('../pages/AttractionPage').then(module => ({ default: module.AttractionPage })));
const DistrictPage = React.lazy(() => import('../pages/DistrictPage').then(module => ({ default: module.DistrictPage })));
const SeasonalPage = React.lazy(() => import('../pages/SeasonalPage').then(module => ({ default: module.SeasonalPage })));
const NationalityLandingPage = React.lazy(() => import('../pages/NationalityLandingPage').then(module => ({ default: module.NationalityLandingPage })));
const DirectoryListingPage = React.lazy(() => import('../pages/DirectoryListingPage').then(module => ({ default: module.DirectoryListingPage })));

export const DirectoryRoutes: React.FC = () => (
    <>
        <Route path="/" element={<DirectoryHome />} />

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
    </>
);
