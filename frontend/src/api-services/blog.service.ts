import { apiClient, ApiError } from "@/lib/api-client";

export interface GuideSection {
  heading: string;
  body: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
}

export interface GuideContent {
  heroImage: string;
  sections: GuideSection[];
  relatedLinks: { label: string; href: string; icon: string }[];
  checklist?: ChecklistItem[];
  checklistTitle?: string;
}

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

export const mockBlogTags: BlogTag[] = [
  { id: "all", name: "All", slug: "all" },
  { id: "first-timer", name: "First-Timer", slug: "first-timer" },
  { id: "food-dining", name: "Food & Dining", slug: "food-dining" },
  { id: "day-trips", name: "Day Trips", slug: "day-trips" },
  { id: "expat-living", name: "Expat Living", slug: "expat-living" },
  { id: "beaches", name: "Beaches", slug: "beaches" },
  { id: "nightlife", name: "Nightlife", slug: "nightlife" },
];

export const mockTravelGuides: BlogPostItem[] = [
  {
    id: "guide-1",
    title: "Alanya First-Timer's Guide",
    slug: "alanya-first-timers-guide",
    tag: "First-Timer",
    icon: "ri-compass-3-line",
    readTime: "8 min read",
    description: "Everything you need to know for your first trip to Alanya — getting around, best areas, money tips, and essential Turkish phrases.",
    content: "Everything you need to know for your first trip to Alanya.",
    cover_image_url: "https://readdy.ai/api/search-image?query=Alanya%20castle%20and%20harbor%20panoramic%20view&width=1200&height=512&seq=tg-hero-1&orientation=landscape",
    published_at: "2026-01-15T10:00:00Z",
  },
  {
    id: "guide-2",
    title: "The Ultimate Food Lover's Alanya",
    slug: "the-ultimate-food-lovers-alanya",
    tag: "Food & Dining",
    icon: "ri-restaurant-2-line",
    readTime: "10 min read",
    description: "From traditional serpme kahvaltı to late-night kokoreç — the complete guide to eating like a local in Alanya.",
    content: "From traditional serpme kahvaltı to late-night kokoreç.",
    cover_image_url: "https://readdy.ai/api/search-image?query=Turkish%20breakfast%20spread%20with%20mezes%20and%20fresh%20bread&width=1200&height=512&seq=tg-hero-2&orientation=landscape",
    published_at: "2026-01-20T10:00:00Z",
  },
  {
    id: "guide-3",
    title: "Best Day Trips from Alanya",
    slug: "best-day-trips-from-alanya",
    tag: "Day Trips",
    icon: "ri-road-map-line",
    readTime: "12 min read",
    description: "Escape the town and explore Sapadere Canyon, Side ruins, Dim Cave, and the Taurus mountain villages.",
    content: "Escape the town and explore Sapadere Canyon, Side ruins, Dim Cave.",
    cover_image_url: "https://readdy.ai/api/search-image?query=Sapadere%20canyon%20waterfalls%20and%20wooden%20walkway&width=1200&height=512&seq=tg-hero-3&orientation=landscape",
    published_at: "2026-02-01T10:00:00Z",
  },
  {
    id: "guide-4",
    title: "Moving to Alanya: Expat Guide",
    slug: "moving-to-alanya-expat-guide",
    tag: "Expat Living",
    icon: "ri-home-heart-line",
    readTime: "15 min read",
    description: "Residency permits, finding an apartment, healthcare, banking, and settling into the expat community.",
    content: "Residency permits, finding an apartment, healthcare, banking.",
    cover_image_url: "https://readdy.ai/api/search-image?query=Modern%20apartment%20balcony%20overlooking%20Alanya%20coastline&width=1200&height=512&seq=tg-hero-4&orientation=landscape",
    published_at: "2026-02-10T10:00:00Z",
  },
  {
    id: "guide-5",
    title: "Alanya Beach Guide",
    slug: "alanya-beach-guide",
    tag: "Beaches",
    icon: "ri-sun-line",
    readTime: "7 min read",
    description: "Cleopatra Beach, Keykubat, Damlataş, and hidden coves — where to find the best sand, water sports, and sunset spots.",
    content: "Cleopatra Beach, Keykubat, Damlataş, and hidden coves.",
    cover_image_url: "https://readdy.ai/api/search-image?query=Cleopatra%20beach%20Alanya%20golden%20sand%20and%20turquoise%20water&width=1200&height=512&seq=tg-hero-5&orientation=landscape",
    published_at: "2026-02-15T10:00:00Z",
  },
  {
    id: "guide-6",
    title: "Alanya Nightlife: Where to Go",
    slug: "alanya-nightlife-where-to-go",
    tag: "Nightlife",
    icon: "ri-music-2-line",
    readTime: "9 min read",
    description: "Harbor clubs, rooftop cocktail bars, live music venues, and chill beach lounges — your guide after dark.",
    content: "Harbor clubs, rooftop cocktail bars, live music venues.",
    cover_image_url: "https://readdy.ai/api/search-image?query=Alanya%20harbor%20nightlife%20with%20illuminated%20boats%20and%20bars&width=1200&height=512&seq=tg-hero-6&orientation=landscape",
    published_at: "2026-02-20T10:00:00Z",
  },
];

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

function calculateReadTime(text?: string | null): string {
  if (!text) return "5 min read";
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function mapBackendPostToItem(post: BackendBlogPostItem): BlogPostItem {
  const normalizedTags: BlogTag[] = Array.isArray(post.tags)
    ? post.tags.map((t) => {
        if (typeof t === "string") {
          return { id: t.toLowerCase(), name: t, slug: t.toLowerCase() };
        }
        return t;
      })
    : [];

  const mainTag =
    normalizedTags.length > 0
      ? normalizedTags[0].name
      : post.category || "Guide";

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || "",
    description: post.excerpt || post.content?.slice(0, 160) || "",
    content: post.content,
    category: post.category || "General",
    cover_image_url:
      post.cover_image_url ||
      "https://readdy.ai/api/search-image?query=Mediterranean%20coast%20travel%20destination%20Alanya%20landscape&width=800&height=500&orientation=landscape",
    author_id: post.author_id,
    author_name: post.author?.full_name || "Alanya Holidays Editor",
    status: post.status || "published",
    view_count: post.view_count || 0,
    is_featured: !!post.is_featured,
    published_at: post.published_at || post.created_at,
    created_at: post.created_at,
    updated_at: post.updated_at,
    tags: normalizedTags,
    tag: mainTag,
    readTime: calculateReadTime(post.content || post.excerpt),
    icon: "ri-compass-3-line",
  };
}

function mapBackendPostToDetail(post: BackendBlogPostItem): BlogPostDetail {
  const item = mapBackendPostToItem(post);
  return {
    ...item,
    content: post.content || item.excerpt || "",
    video_url: post.video_url,
    media_urls: post.media_urls,
    author: post.author,
  };
}

export class BlogService {
  /**
   * Retrieves paginated blog posts or travel guides from live backend.
   */
  async getPosts(
    options: GetBlogPostsOptions = {}
  ): Promise<{ posts: BlogPostItem[]; total: number }> {
    const { page, limit = 20, offset, category, tag, search, status } = options;

    const params: Record<string, string | number | boolean | undefined> = {};
    if (page !== undefined) params.page = page;
    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;
    if (category && category !== "All") params.category = category;
    if (tag && tag !== "All") params.tag = tag;
    if (search) params.search = search;
    if (status) params.status = status;

    const response = await apiClient.get<BackendBlogResponse | BackendBlogPostItem[]>(
      "/blog/posts",
      { params }
    );

    if (Array.isArray(response)) {
      return {
        posts: response.map(mapBackendPostToItem),
        total: response.length,
      };
    }

    if (response && typeof response === "object") {
      const rawPosts = response.data || response.posts;
      if (Array.isArray(rawPosts)) {
        return {
          posts: rawPosts.map(mapBackendPostToItem),
          total: response.total ?? response.count ?? rawPosts.length,
        };
      }
    }

    return {
      posts: [],
      total: 0,
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
      return null;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Retrieves featured blog posts / travel guides.
   */
  async getFeaturedPosts(limit = 3): Promise<BlogPostItem[]> {
    const response = await apiClient.get<BackendBlogPostItem[]>("/blog/featured", {
      params: { limit },
    });
    if (Array.isArray(response)) {
      return response.map(mapBackendPostToItem);
    }
    return [];
  }

  /**
   * Retrieves available blog / travel guide categories and tags.
   */
  async getTags(): Promise<BlogTag[]> {
    const response = await apiClient.get<BlogTag[]>("/blog/tags");
    if (Array.isArray(response)) {
      return response;
    }
    return [];
  }

  /**
   * Submits a community travel guide or blog article for review.
   */
  async submitGuide(
    payload: SubmitGuidePayload
  ): Promise<{ success: boolean; id: string }> {
    const response = await apiClient.post<{ submissionId?: string; id?: string }>(
      "/blog/submissions",
      payload
    );

    return {
      success: true,
      id: response?.submissionId || response?.id || "submitted",
    };
  }

  /**
   * Retrieves detailed guide content (sections, hero image, checklist) dynamically from post.
   */
  async getGuideContent(titleOrSlug: string): Promise<GuideContent | null> {
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
          ],
        };
      }
    } catch {
      // return null if not found
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
