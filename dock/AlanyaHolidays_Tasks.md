# Alanya Holidays — AI Agent Task Document
**Website Rebuild & Feature Development Specification**

---

## Project Overview

| Field | Details |
|-------|---------|
| **Project** | Alanya Holidays — Tourism Directory Platform |
| **Goal** | Transform from booking startup into dominant Alanya/Antalya digital ecosystem |
| **Total Tasks** | 17 tasks across 3 phases |
| **Phase 1 Focus** | UI navigation, listing tiers, location data, blog content |
| **Phase 2 Focus** | SEO architecture, interactive map, community layer |
| **Phase 3 Focus** | AI features, personalization, advanced analytics |
| **Tech Stack** | Next.js, Tailwind, Supabase, Mapbox, Claude API, Algolia |
| **Target Audience** | Tourists, expats, digital nomads, property investors in Alanya/Antalya |

---

## Task Index

### 🔴 Phase 1 — Core (Do First)

| ID | Title | Priority | Module |
|----|-------|----------|--------|
| [UI-001](#ui-001) | ~~Directory Interface Navigation Overhaul~~ ✅ | HIGH | Navigation / Header |
| [UI-002](#ui-002) | ~~Rentals & Services Interface Navigation~~ ✅ | HIGH | Navigation / Header |
| [UI-003](#ui-003) | ~~Admin Panel Access Restriction~~ ✅ | HIGH | Authentication / Permissions |
| [UI-004](#ui-004) | ~~Host Dashboard — Add 'List Rental or Service'~~ ✅ | MEDIUM | Host Dashboard |
| [LST-001](#lst-001) | Add Location Coverage — Antalya Province | HIGH | Directory / Locations |
| [LST-002](#lst-002) | Listing Tiers — Replace 'List Business' with Packages | HIGH | Monetization / Listings |
| [LST-003](#lst-003) | Explorer Tier Feature Set | MEDIUM | Listings / Tiers |
| [LST-004](#lst-004) | Voyager Tier Feature Set | MEDIUM | Listings / Tiers |
| [LST-006](#lst-006) | ~~Category Page — Unify All Categories~~ ✅ | HIGH | Directory / Categories |
| [LST-007](#lst-007) | ~~Remove 'Special Rates' Promise Text from Listings~~ ✅ | MEDIUM | Listings / Content |
| [SEO-001](#seo-001) | Publish Blog Article — Best Beaches in Alanya 2026 | HIGH | Blog / Content |
| [SEO-002](#seo-002) | Publish Blog Article — Hidden Gems in Alanya | HIGH | Blog / Content |

### 🔵 Phase 2 — Growth

| ID | Title | Priority | Module |
|----|-------|----------|--------|
| [LST-005](#lst-005) | Signature Tier Feature Set | MEDIUM | Listings / Tiers |
| [SEO-003](#seo-003) | SEO Silo Architecture — Directory URL Structure | HIGH | SEO / Architecture |
| [MAP-001](#map-001) | Interactive Map-First Discovery | HIGH | Maps / Discovery |
| [COM-001](#com-001) | Community Layer — Launch 'Ask Alanya' | MEDIUM | Community / Forum |
| [COM-002](#com-002) | Community — Internal Linking to Directory | MEDIUM | Community / SEO |

### 🟣 Phase 3 — Elite

| ID | Title | Priority | Module |
|----|-------|----------|--------|
| [AI-001](#ai-001) | AI Itinerary Builder | LOW | AI / Personalization |
| [AI-002](#ai-002) | AI Multilingual Listing Descriptions (Signature) | LOW | AI / Content |

---

---

# 🔴 Phase 1 — Core

---

## UI-001
### Directory Interface Navigation Overhaul
**Priority:** HIGH | **Phase:** 1 | **Module:** Navigation / Header

#### Description
Redesign the top navigation bar for the Directory interface. The logo must shift further left. Remove 'Stays' and 'Services' nav items and replace with a new 4-item menu: `Directory / Blog / Forum / Shop`. Remove the currency selector (EUR) but keep the language selector (EN). Replace the 'List Property' CTA button with a 'Switch to Rentals & Services' button — or move this option into the dropdown user menu.

#### ✅ Acceptance Criteria
- [x] Logo 'Alanya Holidays' is positioned at the far left of the header
- [x] 'Stays' and 'Services' nav items are completely removed from the Directory interface
- [x] Menu shows exactly: `Directory | Blog | Forum | Shop`
- [x] Currency selector (EUR) is hidden in Directory mode
- [x] Language selector (EN) remains visible
- [x] 'List Property' button is removed from the header
- [x] 'Switch to Rentals & Services' button appears in the header OR in the user dropdown

#### 🔧 Technical Notes
- Create a mode-aware navigation component that conditionally renders based on current interface mode (Directory vs Rentals)
- Store current mode in global state / context
- All nav items must be keyboard accessible and mobile responsive

---

## UI-002
### Rentals & Services Interface Navigation
**Priority:** HIGH | **Phase:** 1 | **Module:** Navigation / Header

#### Description
Create a separate navigation configuration for the Rentals & Services interface. Menu items change to: `Villas / Apartments / Vehicles / Services`. The currency selector (EUR) must be restored next to the language selector in this mode, as rental prices depend on currency.

#### ✅ Acceptance Criteria
- [x] When in Rentals & Services mode, menu shows: `Villas | Apartments | Vehicles | Services`
- [x] Currency selector reappears next to language selector in this mode
- [x] Switching between modes preserves user session and does not log out
- [x] Active nav item is visually highlighted

#### 🔧 Technical Notes
- Reuse the mode-aware nav component from UI-001 with a different config object
- Currency selector should default to EUR and persist across sessions (localStorage)

---

## UI-003
### Admin Panel Access Restriction
**Priority:** HIGH | **Phase:** 1 | **Module:** Authentication / Permissions

#### Description
The 'Admin Panel' option in the user dropdown menu must be hidden for all regular users. Only users with the `admin` role should see this option. Regular users should only see: Messages, Profile, Host Dashboard (if host), Sign Out.

#### ✅ Acceptance Criteria
- [x] Admin Panel option is invisible to users without `admin` role
- [x] Admin Panel option is visible and functional for admin-role users
- [x] No frontend code path allows a regular user to navigate to `/admin`
- [x] Backend route for admin panel returns `403` for non-admin users even if URL is typed directly

#### 🔧 Technical Notes
- Implement role-based rendering: check `user.role === 'admin'` before rendering Admin Panel link
- Add server-side route guard middleware on all `/admin/*` routes
- **Never rely solely on frontend hiding — always enforce on backend**

---

## UI-004
### Host Dashboard — Add 'List Rental or Service' Entry
**Priority:** MEDIUM | **Phase:** 1 | **Module:** Host Dashboard

#### Description
Inside the Host Dashboard section of the user dropdown, add a new menu item: **'List Rental or Service'**. This gives hosts a direct path to create a new rental or service listing from the dropdown, without navigating through the main menu.

#### ✅ Acceptance Criteria
- [x] 'List Rental or Service' item appears inside the Host Dashboard section of the dropdown
- [x] Clicking it navigates to the listing creation flow
- [x] Item is only visible to users who have host permissions (not all users)

#### 🔧 Technical Notes
- Check for host role/permission flag before rendering this item
- Link should route to `/host/new-listing` or equivalent

---

## LST-001
### Add Location Coverage — Antalya Province
**Priority:** HIGH | **Phase:** 1 | **Module:** Directory / Locations

#### Description
Expand the location database to include all required cities and districts in the Antalya province. The following locations must be added and selectable in search, listing creation, and map filters.

**Locations to add:**
Antalya (city), Aksu, Dosemealti, Kepez, Konyaalti, Muratpasa, Akseki, Alanya, Avsallar, Konakli, Kestel, Mahmutlar, Kargicak, Demre, Elmali, Finike, Gazipasa, Gundogmus, Ibradi, Kas, Kemer, Korkutel

#### ✅ Acceptance Criteria
- [ ] All 22 locations are in the database with correct Turkish spelling
- [ ] Locations appear in the search/filter dropdown
- [ ] Locations appear as options when creating or editing a listing
- [ ] Locations are linked to their correct geographic coordinates for map display
- [ ] Locations are grouped under parent region (Alanya sub-area vs Antalya city districts)

#### 🔧 Technical Notes
- Seed locations table with lat/lng for each district
- Add hierarchy: `Province > District` structure for better UX
- Turkish characters (ş, ı, ö, ü, ğ, ç) must be stored correctly in UTF-8

---

## LST-002
### Listing Tiers — Replace 'List Business' with Tiered Packages
**Priority:** HIGH | **Phase:** 1 | **Module:** Monetization / Listings

#### Description
Remove all existing content from the 'List Business' page. Replace with a 3-tier package selection UI:

| Tier | Monthly | Annual |
|------|---------|--------|
| Explorer | Free | Free |
| Voyager | $59 | $499 |
| Signature | $199 | $1,999 |
| Destination Partner | Custom | $5,000+ |

When a paid tier is selected, the user is automatically redirected to payment (credit card or IBAN). The free tier skips payment and goes directly to account creation (if not already signed in).

#### ✅ Acceptance Criteria
- [ ] Old 'List Business' page content is completely removed
- [ ] 3 tiers displayed with clear feature comparison
- [ ] Each tier shows monthly and annual pricing with annual savings highlighted
- [ ] Clicking a paid tier redirects to payment step
- [ ] Clicking Free tier redirects to account creation (if not logged in) or directly to listing form (if logged in)
- [ ] Payment accepts credit card and IBAN
- [ ] Destination Partner tier shows a 'Contact Us' CTA, not a price

#### 🔧 Technical Notes
- Explorer (Free): no payment gateway call needed
- Voyager/Signature: integrate Stripe with product IDs per tier
- Store selected tier in session before redirecting to payment so it's applied after success
- IBAN payment can be manual/bank transfer with confirmation email

---

## LST-003
### Explorer Tier Feature Set
**Priority:** MEDIUM | **Phase:** 1 | **Module:** Listings / Tiers

#### Description
Implement the Explorer (Free) tier listing features. Free listings must appear below all paid listings in search results.

**Included features:** business name, description, 1 category, contact info + website link, 5 photos max, basic map placement, traveler reviews enabled, social media links, mobile-friendly listing page.

**Limitations:** appears below paid listings, no featured placement, no booking integrations, lower search visibility.

#### ✅ Acceptance Criteria
- [ ] Explorer listing form allows exactly: name, description, 1 category, contact, website, up to 5 photos, social links
- [ ] Listing page is mobile-responsive
- [ ] Reviews/ratings section is visible on listing page
- [ ] Map pin appears on directory map
- [ ] Explorer listings rank below Voyager and Signature in all search results

#### 🔧 Technical Notes
- Photo upload: enforce 5-image limit on both frontend and backend
- Listing rank score: add `base_score` field — Explorer = 0, Voyager = 100, Signature = 200

---

## LST-004
### Voyager Tier Feature Set
**Priority:** MEDIUM | **Phase:** 1 | **Module:** Listings / Tiers

#### Description
Implement Voyager tier features on top of Explorer. This is the "Most Popular" tier targeting boutique hotels, tour operators, restaurants.

**Additional features over Explorer:** featured placement on destination pages, 'Recommended' badge, priority search ranking, up to 50 photos, video support, direct WhatsApp/contact button, booking link integration, seasonal promotions, event promotion, basic analytics dashboard, dofollow SEO backlink, faster listing approval.

**Special feature — Travel Season Boosts:** listings receive automatic ranking boosts during local peak tourism periods, holidays, festivals, and seasonal searches.

#### ✅ Acceptance Criteria
- [ ] Voyager listings display 'Recommended' badge on listing card
- [ ] Up to 50 photos can be uploaded
- [ ] Video upload or YouTube/Vimeo embed is supported
- [ ] WhatsApp button appears with configured phone number
- [ ] Analytics dashboard shows: views (7d, 30d), clicks, WhatsApp taps, saves
- [ ] Listing appears in 'Featured' section on relevant destination pages
- [ ] Faster approval queue: target < 24h (vs 72h for Explorer)

#### 🔧 Technical Notes
- Video: accept YouTube/Vimeo URLs or direct upload (max 200MB, store on CDN)
- Analytics: log view events to analytics table with `listing_id + timestamp`
- WhatsApp button: `wa.me/{phone}` link format

---

## LST-006
### Category Page — Remove Rental/Services Buttons, Unify All Categories
**Priority:** HIGH | **Phase:** 1 | **Module:** Directory / Categories

#### Description
In the 'Explore by Category' section, remove the separate 'Rental' and 'Services' filter buttons. All categories must be shown on one unified page. The following 3 categories must be moved to the **bottom** of the list:
- Shopping & Souvenirs
- Real Estate
- Visa & Legal

#### ✅ Acceptance Criteria
- [x] 'Rental' and 'Services' filter buttons are removed from the category page
- [x] All categories appear in a single grid/list view
- [x] Shopping & Souvenirs, Real Estate, Visa & Legal are positioned at the end of the grid
- [x] Order of all other categories is preserved
- [x] Page remains visually clean and well-organized

#### 🔧 Technical Notes
- Add a `display_order` field to the categories table
- Set display_order for bottom categories: Shopping = 900, Real Estate = 901, Visa & Legal = 902
- Query: `ORDER BY display_order ASC`

---

## LST-007
### Remove 'Special Rates' Promise Text from Listings
**Priority:** MEDIUM | **Phase:** 1 | **Module:** Listings / Content

#### Description
Each listing currently shows the following text:

> *"Please mention Alanya Holidays when contacting the provider to ensure you receive our special agreed rates and priority service."*

The phrase **"to ensure you receive our special agreed rates and priority service"** must be removed.

Only keep: **"Please mention Alanya Holidays when contacting the provider."**

#### ✅ Acceptance Criteria
- [x] No listing page or card shows the text "to ensure you receive our special agreed rates and priority service"
- [x] The text "Please mention Alanya Holidays when contacting the provider." remains visible
- [x] Change is applied globally across all listing types (hotels, restaurants, tours, etc.)

#### 🔧 Technical Notes
- Find the source of this text — it may be a global config string, a component constant, or a CMS field
- If hardcoded: update the string constant in the component
- If CMS/DB: update the value via admin panel or database migration

---

## SEO-001
### Publish Blog Article — Best Beaches in Alanya 2026
**Priority:** HIGH | **Phase:** 1 | **Module:** Blog / Content

#### Description
Publish the 'Best Beaches in Alanya (2026 Guide)' article to the platform blog. The article content has been provided (see `Best_Beaches_in_Alanya___Antalya__2026_Guide_.pdf`). Each beach section must include description, photos, and highlights.

**Beaches covered:** Cleopatra Beach, Damlataş Beach, Keykubat Beach, Portakal Beach, İncekum Beach.

> ⚠️ **Important:** Remove all mixed Arabic text (`الساحل`, `ساحل`) from the published version — keep English only.

#### ✅ Acceptance Criteria
- [ ] Article is live at `/best-beaches-alanya`
- [ ] Meta title: `Best Beaches in Alanya (2026 Guide) | AlanyaHolidays`
- [ ] Meta description: `Discover the best beaches in Alanya, Turkey. From Cleopatra Beach to peaceful hidden gems, this 2026 guide covers the top coastal destinations.`
- [ ] All 5 beaches have dedicated sections with photos
- [ ] No Arabic text appears in the published article
- [ ] Article links to relevant listing pages (beach directory, nearby restaurants, tours)
- [ ] Article is indexable (not noindex)

#### 🔧 Technical Notes
- Heading structure: H1 for article title, H2 for each beach name
- Add structured data: Article schema + FAQPage schema for the "What Are the Best Beaches?" section
- Internal links: each beach section should link to its directory listing page
- Add Open Graph tags for social sharing

---

## SEO-002
### Publish Blog Article — Hidden Gems in Alanya
**Priority:** HIGH | **Phase:** 1 | **Module:** Blog / Content

#### Description
Publish the 'Hidden Gems in Alanya: Discover the Secret Side of Antalya' article. Content has been provided (see `Hidden_Gems_Alanya__Antalya__Turkiye.pdf`). Tone is travel-guide style, discovery-focused.

**Sections covered:** Sapadere Village & Canyon, Mahmutseydi Village, Dereköy, Akçatı Village, Gökbel Village, Syedra Ancient City, authentic food experiences (Gözleme).

#### ✅ Acceptance Criteria
- [ ] Article is live at `/hidden-gems-alanya`
- [ ] Meta title: `Hidden Gems in Alanya: Secret Places in Antalya | AlanyaHolidays`
- [ ] Meta description: `Discover hidden gems in Alanya and Antalya. Explore secret villages, ancient ruins, authentic Turkish food, and unique things to do beyond the tourist trail.`
- [ ] Proper H2/H3 heading hierarchy throughout
- [ ] "Don't Miss" and travel tip callouts are styled distinctly (callout box or highlighted block)
- [ ] Article links to related directory pages and tour listings

#### 🔧 Technical Notes
- Add structured data: Article schema
- Featured image: use Syedra Ancient City or Sapadere Canyon
- Internal links to `/attractions` and `/tours` directory sections

---

---

# 🔵 Phase 2 — Growth

---

## LST-005
### Signature Tier Feature Set
**Priority:** MEDIUM | **Phase:** 2 | **Module:** Listings / Tiers

#### Description
Implement the Signature tier on top of Voyager. Targets luxury hotels, resorts, tourism agencies, yacht rentals, high-ticket experiences.

**Additional features over Voyager:** homepage exposure, 'Verified Premium' badge, priority lead routing, featured in travel guides/blogs, Instagram/social spotlight, AI-optimized multilingual descriptions (EN/TR/RU/DE/AR), concierge support channel, multiple location listings, advanced analytics + competitor insights, premium media galleries, drone/video showcase, newsletter inclusion, dedicated account manager assignment.

**Special feature — Traveler Intent Matching:** when a traveler searches "luxury Antalya resort" or "family honeymoon hotel", Signature members get boosted visibility and personalized recommendations.

#### ✅ Acceptance Criteria
- [ ] Signature listings appear in a dedicated section on the homepage
- [ ] 'Verified Premium' badge is displayed on all listing cards and pages
- [ ] Listing can have multiple locations (e.g. hotel chain with multiple branches)
- [ ] Advanced analytics shows: competitor comparison, traveler intent data, traffic sources
- [ ] AI description generation button is available in listing editor
- [ ] Newsletter inclusion flag syncs to email marketing tool

#### 🔧 Technical Notes
- AI descriptions: call Claude API with business data, generate in EN/TR/RU/DE/AR
- Multiple locations: `listing_locations` junction table (`listing_id`, `location_id`)
- Competitor insights: compare avg rating, review count, photo count vs category peers

---

## SEO-003
### SEO Silo Architecture — Create Directory URL Structure
**Priority:** HIGH | **Phase:** 2 | **Module:** SEO / Architecture

#### Description
Implement a clean silo URL structure for all directory categories. This creates topical authority and drives massive long-term organic traffic.

**Target structure:**
```
/beaches/
  /beaches/cleopatra-beach/
/restaurants/
  /restaurants/best-breakfast-alanya/
/hotels/
  /hotels/mahmutlar/
/tours/
  /tours/boat-tours-alanya/
```

Each top-level category page must be a proper SEO landing page with description, featured listings, and links to sub-pages.

#### ✅ Acceptance Criteria
- [ ] All category URLs follow the `/category/sub-page/` pattern
- [ ] Category landing pages have unique meta titles and descriptions
- [ ] Breadcrumb navigation implemented: `Home > Beaches > Cleopatra Beach`
- [ ] Canonical URLs are set on all listing pages
- [ ] No duplicate content between category pages
- [ ] `sitemap.xml` is auto-generated and includes all directory pages

#### 🔧 Technical Notes
- Dynamic routes: `/[category]/[slug]` pattern in Next.js
- Generate static pages for all listings at build time (SSG) for performance
- Add `BreadcrumbList` structured data (JSON-LD)
- Auto-submit sitemap to Google Search Console

---

## MAP-001
### Interactive Map-First Discovery
**Priority:** HIGH | **Phase:** 2 | **Module:** Maps / Discovery

#### Description
Implement a full interactive map browsing experience (like Airbnb/Booking.com maps). Users should be able to browse all listing types on a map. This dramatically increases engagement and should be treated as a primary discovery mode, not just supplementary.

**Map filters:** beach distance, nightlife nearby, family-friendly, luxury, budget, historical district, sea view.

#### ✅ Acceptance Criteria
- [ ] Map view is accessible from the main directory page as a toggle (List / Map)
- [ ] All listing types appear as pins on the map
- [ ] Clustering is implemented for zoomed-out views
- [ ] Filter panel works on map: category, price, amenities
- [ ] Clicking a pin shows a floating preview card with photo, name, rating, quick link
- [ ] Map is mobile responsive with touch/pinch zoom
- [ ] "Things near me" button uses browser geolocation API

#### 🔧 Technical Notes
- Use Mapbox GL JS or Google Maps API
- `lat` / `lng` must be required fields on every listing
- Clustering: use Mapbox Supercluster or equivalent
- Geolocation: `navigator.geolocation.getCurrentPosition()`

---

## COM-001
### Community Layer — Launch 'Ask Alanya'
**Priority:** MEDIUM | **Phase:** 2 | **Module:** Community / Forum

#### Description
Launch the community section under the 'Forum' nav item. Brand it as **"Ask Alanya"** (not a generic forum). Format: Q&A style (Reddit/Quora-like). Seed with 100–300 high-quality starter threads using AI-assisted content to make it look alive immediately.

**Main categories:**
- Visiting Alanya (first-timers, itineraries, family travel)
- Beaches & Nature
- Food & Cafes
- Living in Antalya (expat advice, visas, rentals, neighborhoods)
- Digital Nomads
- Real Estate & Investment
- Events & Meetups
- Ask Locals

#### ✅ Acceptance Criteria
- [ ] Forum is accessible at `/forum` or `/community`
- [ ] All 8 main categories are created
- [ ] Users can post questions and reply to threads
- [ ] Thread pages are publicly indexable by Google (no login required to read)
- [ ] Login is required to post
- [ ] 100+ starter threads are seeded and appear natural/authentic
- [ ] Mobile layout is fully functional
- [ ] Spam protection is active (email verification required before first post)

#### 🔧 Technical Notes
- Consider Discourse, Circle, or Bettermode for fast launch — embed or white-label
- If custom built: `threads` table (`id, category_id, title, body, user_id, created_at`) + `replies` table
- SEO: every thread gets a unique URL with title-based slug
- AI moderation: flag posts containing phone numbers, external payment links, crypto mentions

---

## COM-002
### Community — Internal Linking to Directory
**Priority:** MEDIUM | **Phase:** 2 | **Module:** Community / SEO

#### Description
Every forum thread and discussion should surface contextual links back to relevant directory listings, guide pages, and blog posts. This creates a powerful internal linking ecosystem and drives traffic from community pages to listings.

Example: a thread in the "Beaches" category automatically shows sidebar links to beach directory pages, nearby restaurants, and tour listings.

#### ✅ Acceptance Criteria
- [ ] Thread pages display a "Related Listings" sidebar section
- [ ] Category-based auto-linking: threads in 'Beaches' category show top beach listings
- [ ] Related blog articles also appear in the sidebar
- [ ] All links are dofollow with proper anchor text

#### 🔧 Technical Notes
- Tag threads with category → map category to directory section
- Sidebar widget queries top-rated listings for the matching category
- Phase 3: upgrade to AI-powered related content suggestions

---

---

# 🟣 Phase 3 — Elite

---

## AI-001
### AI Itinerary Builder
**Priority:** LOW | **Phase:** 3 | **Module:** AI / Personalization

#### Description
Build an AI-powered itinerary generator. User inputs trip parameters, AI outputs a full day-by-day itinerary using listings from the Alanya Holidays directory.

**User inputs:** trip duration (days), travel style (adventure / family / luxury / budget), interests, base location.

**Output:** day-by-day itinerary with listings from the directory, map route, and estimated timings.

#### ✅ Acceptance Criteria
- [ ] User can input trip parameters via a simple form
- [ ] AI generates a structured day-by-day itinerary
- [ ] Each recommended place links to its directory listing
- [ ] Itinerary can be saved to user account
- [ ] Itinerary can be shared via a public link

#### 🔧 Technical Notes
- Call Claude API (`claude-sonnet-4-20250514`) with directory data as context
- Structure output as JSON: `{ day: 1, stops: [{ listing_id, name, time, notes }] }`
- Render stops on a map with route visualization (Mapbox Directions API)

---

## AI-002
### AI Multilingual Listing Descriptions (Signature Tier)
**Priority:** LOW | **Phase:** 3 | **Module:** AI / Content

#### Description
Signature-tier business owners can click a **"Generate AI Description"** button in their listing editor. The AI generates SEO-optimized, travel-focused descriptions in 5 languages: English, Turkish, Russian, German, Arabic.

#### ✅ Acceptance Criteria
- [ ] Button appears in Signature listing editor only (hidden for Explorer/Voyager)
- [ ] Generates descriptions in EN, TR, RU, DE, AR
- [ ] User can edit the generated text before saving
- [ ] Generated descriptions are stored per language in the listing

#### 🔧 Technical Notes
- Call Claude API with: business name, category, location, amenities, user's existing description
- Return JSON: `{ en: "...", tr: "...", ru: "...", de: "...", ar: "..." }`
- Display each language in a tab in the listing editor
- Arabic output: ensure RTL text direction is set in the rendered listing

---

*Document generated for Alanya Holidays development team — May 2026*
