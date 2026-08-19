import { apiClient } from "@/lib/api-client";
import { guideContents, type GuideContent } from "@/mocks/travelGuideContents";

export type { GuideContent };

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  category?: string;
  cover_image_url?: string | null;
  author_id?: string | null;
  author_name?: string;
  status?: string;
  view_count?: number;
  is_featured?: boolean;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
  tags?: Array<BlogTag | string>;
  // Travel guides page display helpers
  icon?: string;
  readTime?: string;
  description?: string;
  tag?: string;
}

export interface BlogPostDetail extends BlogPostItem {
  content: string;
  video_url?: string | null;
  media_urls?: string[];
  author?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  } | null;
  relatedPosts?: BlogPostItem[];
}

export interface GetBlogPostsOptions {
  page?: number;
  limit?: number;
  offset?: number;
  category?: string;
  tag?: string;
  search?: string;
  status?: string;
}

export interface SubmitGuidePayload {
  title: string;
  content: string;
  author_name?: string;
  author_email?: string;
  category?: string;
  tags?: string[];
  video_url?: string;
  media_urls?: string[];
  payment_details?: Record<string, string | number | boolean>;
}

export interface BackendBlogResponse {
  data?: BackendBlogPostItem[];
  posts?: BackendBlogPostItem[];
  total?: number;
  count?: number;
}

export interface BackendBlogPostItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string;
  category?: string | null;
  cover_image_url?: string | null;
  author_id?: string | null;
  status?: string;
  view_count?: number;
  is_featured?: boolean;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
  author?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  } | null;
  tags?: Array<{ id: string; name: string; slug: string } | string>;
  video_url?: string | null;
  media_urls?: string[];
}

export const mockBlogTags: BlogTag[] = [
  { id: "tag-1", name: "Essential", slug: "essential" },
  { id: "tag-2", name: "Food & Drink", slug: "food-drink" },
  { id: "tag-3", name: "Adventure", slug: "adventure" },
  { id: "tag-4", name: "Expats", slug: "expats" },
  { id: "tag-5", name: "Beaches", slug: "beaches" },
  { id: "tag-6", name: "Nightlife", slug: "nightlife" },
];

export const mockTravelGuides: BlogPostItem[] = [
  {
    id: "guide-1",
    icon: "ri-anchor-line",
    title: "Alanya First-Timer's Guide",
    slug: "alanya-first-timers-guide",
    description:
      "Everything you need to know for your first visit — from airport transfers to which neighborhoods to explore first.",
    excerpt:
      "Everything you need to know for your first visit — from airport transfers to which neighborhoods to explore first.",
    readTime: "8 min read",
    tag: "Essential",
    category: "Essential",
    cover_image_url:
      "https://readdy.ai/api/search-image?query=Panoramic%20view%20of%20Alanya%20harbor%20at%20golden%20hour%20with%20the%20Red%20Tower%20fortress%20and%20ancient%20city%20walls%20overlooking%20the%20Mediterranean%20Sea%20whitewashed%20buildings%20climbing%20the%20hillside%20warm%20amber%20light%20Turkish%20riviera%20landscape%20soft%20natural%20tones&width=1200&height=512&seq=guide-essential-hero&orientation=landscape",
    is_featured: true,
    view_count: 1420,
    tags: [{ id: "tag-1", name: "Essential", slug: "essential" }],
  },
  {
    id: "guide-2",
    icon: "ri-restaurant-2-line",
    title: "The Ultimate Food Lover's Alanya",
    slug: "the-ultimate-food-lovers-alanya",
    description:
      "A curated journey through Alanya's culinary landscape — kebabs, mezes, street food, and fine dining with a view.",
    excerpt:
      "A curated journey through Alanya's culinary landscape — kebabs, mezes, street food, and fine dining with a view.",
    readTime: "12 min read",
    tag: "Food & Drink",
    category: "Food & Drink",
    cover_image_url:
      "https://readdy.ai/api/search-image?query=Rich%20Turkish%20breakfast%20spread%20on%20ornate%20copper%20tray%20with%20menemen%20eggs%20simit%20bread%20olives%20honey%20kaymak%20cheese%20varieties%20Turkish%20tea%20in%20tulip%20glasses%20overlooking%20Mediterranean%20harbor%20soft%20morning%20light%20terracotta%20and%20turquoise%20color%20palette%20editorial%20food%20photography&width=1200&height=512&seq=guide-food-hero&orientation=landscape",
    is_featured: true,
    view_count: 980,
    tags: [{ id: "tag-2", name: "Food & Drink", slug: "food-drink" }],
  },
  {
    id: "guide-3",
    icon: "ri-riding-line",
    title: "Best Day Trips from Alanya",
    slug: "best-day-trips-from-alanya",
    description:
      "From the ancient ruins of Side to the waterfalls of Manavgat — the best excursions within a two-hour drive.",
    excerpt:
      "From the ancient ruins of Side to the waterfalls of Manavgat — the best excursions within a two-hour drive.",
    readTime: "10 min read",
    tag: "Adventure",
    category: "Adventure",
    cover_image_url:
      "https://readdy.ai/api/search-image?query=Ancient%20Roman%20amphitheater%20ruins%20of%20Side%20overlooking%20Mediterranean%20turquoise%20water%20dramatic%20stone%20columns%20against%20bright%20blue%20sky%20golden%20sunshine%20archaeological%20site%20travel%20photography%20warm%20Mediterranean%20tones%20ancient%20history&width=1200&height=512&seq=guide-adventure-hero&orientation=landscape",
    is_featured: false,
    view_count: 850,
    tags: [{ id: "tag-3", name: "Adventure", slug: "adventure" }],
  },
  {
    id: "guide-4",
    icon: "ri-home-5-line",
    title: "Moving to Alanya: Expat Guide",
    slug: "moving-to-alanya-expat-guide",
    description:
      "A comprehensive guide to relocating — visas, residency permits, renting apartments, healthcare, and building a social life.",
    excerpt:
      "A comprehensive guide to relocating — visas, residency permits, renting apartments, healthcare, and building a social life.",
    readTime: "15 min read",
    tag: "Expats",
    category: "Expats",
    cover_image_url:
      "https://readdy.ai/api/search-image?query=Cozy%20modern%20apartment%20balcony%20overlooking%20Alanya%20coastline%20with%20Turkish%20coffee%20cup%20on%20small%20table%20terracotta%20plant%20pots%20relaxing%20residential%20neighborhood%20view%20Mediterranean%20Sea%20in%20distance%20warm%20afternoon%20light%20soft%20lifestyle%20photography%20homely%20atmosphere&width=1200&height=512&seq=guide-expat-hero&orientation=landscape",
    is_featured: false,
    view_count: 1120,
    tags: [{ id: "tag-4", name: "Expats", slug: "expats" }],
  },
  {
    id: "guide-5",
    icon: "ri-sun-line",
    title: "Alanya Beach Guide",
    slug: "alanya-beach-guide",
    description:
      "Cleopatra Beach, Keykubat, Damlatas, Portakal, and the hidden coves only locals know about — ranked and reviewed.",
    excerpt:
      "Cleopatra Beach, Keykubat, Damlatas, Portakal, and the hidden coves only locals know about — ranked and reviewed.",
    readTime: "7 min read",
    tag: "Beaches",
    category: "Beaches",
    cover_image_url:
      "https://readdy.ai/api/search-image?query=Stunning%20turquoise%20Mediterranean%20water%20lapping%20against%20golden%20sandy%20Cleopatra%20Beach%20in%20Alanya%20with%20sun%20loungers%20and%20colorful%20umbrellas%20distant%20Taurus%20Mountains%20backdrop%20clear%20blue%20sky%20summer%20afternoon%20vibrant%20coastal%20photography%20bright%20natural%20colors&width=1200&height=512&seq=guide-beach-hero&orientation=landscape",
    is_featured: true,
    view_count: 1650,
    tags: [{ id: "tag-5", name: "Beaches", slug: "beaches" }],
  },
  {
    id: "guide-6",
    icon: "ri-moon-clear-line",
    title: "Alanya Nightlife: Where to Go",
    slug: "alanya-nightlife-where-to-go",
    description:
      "Rooftop bars, beach clubs, live music venues, and the best spots for a laid-back evening or a wild night out.",
    excerpt:
      "Rooftop bars, beach clubs, live music venues, and the best spots for a laid-back evening or a wild night out.",
    readTime: "9 min read",
    tag: "Nightlife",
    category: "Nightlife",
    cover_image_url:
      "https://readdy.ai/api/search-image?query=Elegant%20rooftop%20cocktail%20bar%20at%20night%20overlooking%20illuminated%20Alanya%20harbor%20and%20Red%20Tower%20with%20string%20lights%20warm%20ambient%20glow%20Mediterranean%20bay%20below%20lively%20yet%20sophisticated%20atmosphere%20night%20photography%20deep%20blue%20sky%20golden%20city%20lights&width=1200&height=512&seq=guide-nightlife-hero&orientation=landscape",
    is_featured: false,
    view_count: 940,
    tags: [{ id: "tag-6", name: "Nightlife", slug: "nightlife" }],
  },
];

export function getCategoryIcon(category?: string): string {
  if (!category) return "ri-book-open-line";
  const cat = category.toLowerCase();
  if (cat.includes("food") || cat.includes("drink") || cat.includes("culinary"))
    return "ri-restaurant-2-line";
  if (cat.includes("adventure") || cat.includes("trip") || cat.includes("outdoor"))
    return "ri-riding-line";
  if (cat.includes("expat") || cat.includes("relocat") || cat.includes("living"))
    return "ri-home-5-line";
  if (cat.includes("beach") || cat.includes("sea") || cat.includes("sun"))
    return "ri-sun-line";
  if (cat.includes("night") || cat.includes("club") || cat.includes("bar"))
    return "ri-moon-clear-line";
  if (cat.includes("essential") || cat.includes("first") || cat.includes("guide"))
    return "ri-anchor-line";
  return "ri-book-open-line";
}

export function calculateReadTime(content?: string, excerpt?: string): string {
  const text = (content || excerpt || "").replace(/<[^>]*>/g, "");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export function mapBackendPostToItem(post: BackendBlogPostItem): BlogPostItem {
  const readTime = calculateReadTime(post.content, post.excerpt || undefined);
  const tag = post.category || "General";
  const icon = getCategoryIcon(tag);
  const description =
    post.excerpt ||
    (post.content ? post.content.replace(/<[^>]*>/g, "").slice(0, 140) + "..." : "");

  const mappedTags: Array<BlogTag | string> = Array.isArray(post.tags)
    ? post.tags.map((t) => (typeof t === "string" ? t : { id: t.id, name: t.name, slug: t.slug }))
    : [];

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || undefined,
    content: post.content,
    category: post.category || undefined,
    cover_image_url: post.cover_image_url,
    author_id: post.author_id,
    author_name: post.author?.full_name,
    status: post.status,
    view_count: post.view_count ?? 0,
    is_featured: !!post.is_featured,
    published_at: post.published_at,
    created_at: post.created_at,
    updated_at: post.updated_at,
    tags: mappedTags,
    icon,
    readTime,
    description,
    tag,
  };
}

export function mapBackendPostToDetail(post: BackendBlogPostItem): BlogPostDetail {
  const item = mapBackendPostToItem(post);
  return {
    ...item,
    content: post.content || item.excerpt || "",
    video_url: post.video_url,
    media_urls: post.media_urls || [],
    author: post.author || null,
  };
}

export class BlogService {
  /**
   * Retrieves blog posts / travel guides with pagination, filters, and offline fallback.
   */
  async getPosts(
    options: GetBlogPostsOptions = {}
  ): Promise<{ posts: BlogPostItem[]; total: number }> {
    const { category, tag, search, limit, page, offset, status } = options;

    try {
      const params: Record<string, string | number | boolean | undefined> = {};
      if (category) params.category = category;
      if (tag) params.tag = tag;
      if (search) params.search = search;
      if (limit) params.limit = limit;
      if (page) params.page = page;
      if (offset !== undefined) params.offset = offset;
      if (status) params.status = status;

      const response = await apiClient.get<BackendBlogResponse | BackendBlogPostItem[]>(
        "/blog",
        { params }
      );

      if (response) {
        if (Array.isArray(response) && response.length > 0) {
          return {
            posts: response.map(mapBackendPostToItem),
            total: response.length,
          };
        }

        const resObj = response as BackendBlogResponse;
        const rawPosts = resObj.data || resObj.posts;
        if (Array.isArray(rawPosts) && rawPosts.length > 0) {
          return {
            posts: rawPosts.map(mapBackendPostToItem),
            total: resObj.total ?? resObj.count ?? rawPosts.length,
          };
        }
      }
    } catch (err) {
      console.warn("Failed to fetch blog posts from API, using fallback mock:", err);
    }

    // Mock fallback handling
    let filtered = [...mockTravelGuides];

    if (category && category !== "All") {
      filtered = filtered.filter(
        (g) =>
          g.category?.toLowerCase() === category.toLowerCase() ||
          g.tag?.toLowerCase() === category.toLowerCase()
      );
    }

    if (tag && tag !== "All") {
      filtered = filtered.filter((g) => {
        if (!g.tags) return false;
        return g.tags.some((t) => {
          if (typeof t === "string") return t.toLowerCase() === tag.toLowerCase();
          return t.name.toLowerCase() === tag.toLowerCase() || t.slug.toLowerCase() === tag.toLowerCase();
        });
      });
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.description?.toLowerCase().includes(q) ||
          g.excerpt?.toLowerCase().includes(q) ||
          g.category?.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    if (limit && limit > 0) {
      filtered = filtered.slice(0, limit);
    }

    return {
      posts: filtered,
      total,
    };
  }

  /**
   * Retrieves a single blog post or travel guide by its slug.
   */
  async getPostBySlug(slug: string): Promise<BlogPostDetail | null> {
    try {
      const response = await apiClient.get<BackendBlogPostItem>(`/blog/post/${slug}`);
      if (response && response.id) {
        return mapBackendPostToDetail(response);
      }
    } catch (err) {
      console.warn(`Failed to fetch blog post '${slug}' from API, searching fallback:`, err);
    }

    // Mock fallback search
    const foundMock = mockTravelGuides.find(
      (g) =>
        g.slug === slug ||
        g.id === slug ||
        g.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug.toLowerCase()
    );

    if (foundMock) {
      const guideContent = guideContents[foundMock.title];
      const sectionsBody = guideContent?.sections
        ? guideContent.sections.map((s) => `### ${s.heading}\n${s.body}`).join("\n\n")
        : foundMock.description || "";

      return {
        ...foundMock,
        content: sectionsBody,
        cover_image_url: guideContent?.heroImage || foundMock.cover_image_url,
      };
    }

    return null;
  }

  /**
   * Retrieves featured blog posts / travel guides.
   */
  async getFeaturedPosts(limit = 3): Promise<BlogPostItem[]> {
    try {
      const response = await apiClient.get<BackendBlogPostItem[]>("/blog/featured", {
        params: { limit },
      });
      if (Array.isArray(response) && response.length > 0) {
        return response.map(mapBackendPostToItem);
      }
    } catch (err) {
      console.warn("Failed to fetch featured blog posts from API, using fallback:", err);
    }

    const featuredMocks = mockTravelGuides.filter((g) => g.is_featured);
    const result = featuredMocks.length > 0 ? featuredMocks : mockTravelGuides;
    return result.slice(0, limit);
  }

  /**
   * Retrieves available blog / travel guide categories and tags.
   */
  async getTags(): Promise<BlogTag[]> {
    try {
      const response = await apiClient.get<BlogTag[]>("/blog/tags");
      if (Array.isArray(response) && response.length > 0) {
        return response;
      }
    } catch (err) {
      console.warn("Failed to fetch blog tags from API, using fallback:", err);
    }

    return mockBlogTags;
  }

  /**
   * Submits a community travel guide or blog article for review.
   */
  async submitGuide(
    payload: SubmitGuidePayload
  ): Promise<{ success: boolean; id: string }> {
    try {
      const response = await apiClient.post<{ submissionId?: string; id?: string }>(
        "/blog/submissions",
        payload
      );

      if (response && (response.submissionId || response.id)) {
        return {
          success: true,
          id: response.submissionId || response.id || "submitted",
        };
      }
    } catch (err) {
      console.warn("Failed to submit guide to API, generating fallback response:", err);
    }

    return {
      success: true,
      id: `local-sub-${Date.now()}`,
    };
  }

  /**
   * Retrieves detailed guide content (sections, hero image, checklist) by title or slug.
   */
  async getGuideContent(titleOrSlug: string): Promise<GuideContent | null> {
    // 1. Check direct match in guideContents dictionary
    if (guideContents[titleOrSlug]) {
      return guideContents[titleOrSlug];
    }

    // 2. Check case-insensitive and slugified match
    const targetSlug = titleOrSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    for (const [title, content] of Object.entries(guideContents)) {
      const currentSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      if (title.toLowerCase() === titleOrSlug.toLowerCase() || currentSlug === targetSlug) {
        return content;
      }
    }

    // 3. Try to fetch dynamically from API
    try {
      const post = await this.getPostBySlug(titleOrSlug);
      if (post && post.content) {
        return {
          heroImage:
            post.cover_image_url ||
            "https://readdy.ai/api/search-image?query=Turkish%20Riviera%20Mediterranean%20coastline&width=1200&height=512&seq=dynamic-guide-fallback&orientation=landscape",
          sections: [
            {
              heading: post.title,
              body: post.content.replace(/<[^>]*>/g, ""),
            },
          ],
          relatedLinks: [
            { label: "Explore Alanya", href: "/explore", icon: "ri-store-2-line" },
            { label: "Plan Itinerary", href: "/planner", icon: "ri-calendar-check-line" },
          ],
        };
      }
    } catch (err) {
      console.warn(`Failed to resolve dynamic guide content for '${titleOrSlug}':`, err);
    }

    return null;
  }
}

export const blogService = new BlogService();

export const getPosts = (options?: GetBlogPostsOptions) => blogService.getPosts(options);
export const getPostBySlug = (slug: string) => blogService.getPostBySlug(slug);
export const getFeaturedPosts = (limit?: number) => blogService.getFeaturedPosts(limit);
export const getTags = () => blogService.getTags();
export const submitGuide = (payload: SubmitGuidePayload) => blogService.submitGuide(payload);
export const getGuideContent = (titleOrSlug: string) => blogService.getGuideContent(titleOrSlug);
