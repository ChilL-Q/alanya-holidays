import { apiClient } from "@/lib/api-client";
import { categories as mockCategories, type Category } from "@/mocks/categories";
import { trendingThreads as mockTrendingThreads, type CategoryThread } from "@/mocks/threads";
import { categoryThreads as mockCategoryThreads } from "@/mocks/category-threads";
import { threadDetails as mockThreadDetails, type ThreadDetail, type ThreadReply } from "@/mocks/thread-details";

export type { Category, CategoryThread, ThreadDetail, ThreadReply };

export interface GetThreadsOptions {
  categoryId?: string;
  categorySlug?: string;
  sort?: "latest" | "hot" | "popular" | "unreplied";
  limit?: number;
  offset?: number;
  isHot?: boolean;
  subcategory?: string;
  postType?: "discussion" | "question";
}

export interface GetThreadsResult {
  threads: CategoryThread[];
  total: number;
}

export interface CreateThreadInput {
  title: string;
  body: string;
  category_id?: string;
  categoryId?: string;
  subcategory?: string;
  post_type?: "discussion" | "question";
}

export interface CreateCommentInput {
  postId: string;
  body: string;
  parentId?: string | null;
}

export interface ForumBackendCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sort_order?: number;
  parent_id?: string | null;
  icon?: string | null;
  image_url?: string | null;
  accent?: string | null;
  created_at?: string;
  children?: ForumBackendCategory[];
  topic_count?: number;
  discussion_count?: number;
  parent?: ForumBackendCategory | null;
}

export interface ForumBackendPost {
  id: string;
  slug: string;
  title: string;
  body: string;
  category_id?: string;
  author_id?: string;
  post_type?: "discussion" | "question";
  views_count?: number;
  likes_count?: number;
  comments_count?: number;
  is_pinned?: boolean;
  is_locked?: boolean;
  is_removed?: boolean;
  created_at?: string;
  updated_at?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    sort_order?: number;
    parent_id?: string | null;
    icon?: string;
    image_url?: string;
    accent?: string;
    parent?: ForumBackendCategory | null;
  };
  author?: {
    full_name?: string;
    avatar_url?: string;
  };
  liked_by_me?: boolean;
}

export interface ForumBackendComment {
  id: string;
  post_id: string;
  author_id?: string;
  body: string;
  likes_count?: number;
  is_removed?: boolean;
  created_at?: string;
  updated_at?: string;
  author?: {
    full_name?: string;
    avatar_url?: string;
  };
  liked_by_me?: boolean;
}

export function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "recently";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return "just now";
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks === 1 ? "" : "s"} ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
  } catch {
    return dateStr;
  }
}

function mapBackendCategoryToCategory(cat: ForumBackendCategory): Category {
  const matchingMock = mockCategories.find(
    (m) =>
      m.id === cat.slug ||
      m.id === cat.id ||
      m.name.toLowerCase() === cat.name.toLowerCase()
  );

  const subcategories =
    cat.children && cat.children.length > 0
      ? cat.children.map((c) => c.name)
      : matchingMock?.subcategories || [];

  return {
    id: cat.slug || cat.id,
    name: cat.name,
    icon: cat.icon || matchingMock?.icon || "ri-chat-3-line",
    description:
      cat.description ||
      matchingMock?.description ||
      `Explore topics and discussions about ${cat.name}`,
    threadCount:
      cat.discussion_count ??
      matchingMock?.threadCount ??
      (cat.children ? cat.children.length * 15 : 10),
    memberCount:
      matchingMock?.memberCount ??
      Math.max(25, Math.floor((cat.discussion_count ?? 50) * 0.4)),
    subcategories,
    color: cat.accent || matchingMock?.color || "bg-primary-500",
    image:
      cat.image_url ||
      matchingMock?.image ||
      "https://readdy.ai/api/search-image?query=Mediterranean%20coastal%20scene%20with%20turquoise%20water&width=800&height=600&seq=cat-default&orientation=landscape",
  };
}

function mapBackendPostToThread(post: ForumBackendPost): CategoryThread {
  const categoryName = post.category?.name || "General";
  const categoryId = post.category?.slug || post.category?.id || "general";
  const subcategory = post.category?.parent ? post.category.name : undefined;

  return {
    id: post.slug || post.id,
    title: post.title,
    category: categoryName,
    categoryId: categoryId,
    author: post.author?.full_name || "Community Member",
    authorAvatar:
      post.author?.avatar_url ||
      "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20natural%20light&width=100&height=100&seq=avatar-user&orientation=squarish",
    replies: post.comments_count ?? 0,
    views: post.views_count ?? 0,
    likes: post.likes_count ?? 0,
    postedAt: formatRelativeTime(post.created_at),
    isHot:
      (post.views_count ?? 0) > 100 || (post.comments_count ?? 0) > 10,
    isPinned: !!post.is_pinned,
    isVerified: false,
    excerpt:
      post.body && post.body.length > 150
        ? `${post.body.slice(0, 150)}...`
        : post.body || "",
    subcategory,
  };
}

function mapBackendPostToThreadDetail(
  post: ForumBackendPost,
  comments: ForumBackendComment[] = []
): ThreadDetail {
  const categoryName = post.category?.name || "General";
  const categoryId = post.category?.slug || post.category?.id || "general";
  const subcategory = post.category?.parent
    ? post.category.name
    : post.category?.name || "";

  const replies: ThreadReply[] = (comments || []).map((c) => ({
    id: c.id,
    author: c.author?.full_name || "Community Member",
    authorAvatar:
      c.author?.avatar_url ||
      "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait&width=100&height=100&seq=reply-avatar&orientation=squarish",
    authorRole: "Member",
    content: c.body || "",
    postedAt: formatRelativeTime(c.created_at),
    likes: c.likes_count ?? 0,
    isLiked: !!c.liked_by_me,
    parentId: null,
    replies: [],
  }));

  return {
    id: post.slug || post.id,
    title: post.title,
    category: categoryName,
    categoryId: categoryId,
    subcategory: subcategory,
    author: post.author?.full_name || "Community Member",
    authorAvatar:
      post.author?.avatar_url ||
      "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20warm%20smile&width=200&height=200&seq=author-avatar&orientation=squarish",
    authorRole: "Author",
    authorBio: "Alanya enthusiast & verified community member.",
    authorPosts: 15,
    authorReputation: 320,
    authorJoinDate: "2024",
    authorLocation: "Alanya, Türkiye",
    authorBadges: ["Community Contributor"],
    content: post.body || "",
    postedAt: formatRelativeTime(post.created_at),
    views: post.views_count ?? 0,
    likes: post.likes_count ?? 0,
    isLiked: !!post.liked_by_me,
    isPinned: !!post.is_pinned,
    isHot:
      (post.views_count ?? 0) > 100 || (post.comments_count ?? 0) > 10,
    isVerified: false,
    replies,
    slug: post.slug,
  };
}

export class ForumService {
  /**
   * Retrieves all forum categories (as tree with nested children if available).
   * Falls back to mock data on error or empty response.
   */
  async getCategories(): Promise<Category[]> {
    try {
      const data = await apiClient.get<ForumBackendCategory[]>("/forum/categories/tree");
      if (Array.isArray(data) && data.length > 0) {
        return data.map(mapBackendCategoryToCategory);
      }

      const flatData = await apiClient.get<ForumBackendCategory[]>("/forum/categories");
      if (Array.isArray(flatData) && flatData.length > 0) {
        return flatData.filter((c) => !c.parent_id).map(mapBackendCategoryToCategory);
      }
    } catch (err) {
      console.warn("Failed to fetch forum categories from API, using fallback mock:", err);
    }

    return mockCategories;
  }

  /**
   * Retrieves a single category by its slug or ID.
   */
  async getCategoryById(idOrSlug: string): Promise<Category | null> {
    try {
      const data = await apiClient.get<ForumBackendCategory>(`/forum/categories/slug/${idOrSlug}`);
      if (data && data.id) {
        return mapBackendCategoryToCategory(data);
      }
    } catch (err) {
      console.warn(`Failed to fetch category '${idOrSlug}' from API, searching fallback:`, err);
    }

    const fallback = mockCategories.find(
      (c) =>
        c.id === idOrSlug ||
        c.name.toLowerCase() === idOrSlug.toLowerCase() ||
        c.id.replace(/-/g, "") === idOrSlug.replace(/-/g, "")
    );
    return fallback || null;
  }

  /**
   * Retrieves threads with optional filters, pagination, and sorting.
   */
  async getThreads(options: GetThreadsOptions = {}): Promise<GetThreadsResult> {
    const {
      categoryId,
      categorySlug,
      sort = "latest",
      limit = 20,
      offset = 0,
      isHot,
      subcategory,
      postType,
    } = options;

    const resolvedCategorySlug = categorySlug || categoryId;

    try {
      if (isHot && !resolvedCategorySlug) {
        const hotData = await apiClient.get<ForumBackendPost[]>("/forum/posts/hot", {
          params: { limit },
        });
        if (Array.isArray(hotData) && hotData.length > 0) {
          const threads = hotData.map(mapBackendPostToThread);
          return { threads, total: threads.length };
        }
      }

      const params: Record<string, string | number | boolean | undefined> = {
        sort,
        limit,
        offset,
      };
      if (resolvedCategorySlug) params.categorySlug = resolvedCategorySlug;
      if (postType) params.postType = postType;

      const response = await apiClient.get<{ data: ForumBackendPost[]; total: number }>(
        "/forum/posts",
        { params }
      );

      if (response && Array.isArray(response.data) && response.data.length > 0) {
        let threads = response.data.map(mapBackendPostToThread);
        if (subcategory) {
          threads = threads.filter((t) => t.subcategory === subcategory);
        }
        return {
          threads,
          total: response.total ?? threads.length,
        };
      }
    } catch (err) {
      console.warn("Failed to fetch forum threads from API, using fallback mock:", err);
    }

    // Fallback mock handling
    let threads: CategoryThread[] = [];
    if (resolvedCategorySlug && mockCategoryThreads[resolvedCategorySlug]) {
      threads = [...mockCategoryThreads[resolvedCategorySlug]];
    } else if (resolvedCategorySlug) {
      // Find category key in mockCategoryThreads
      const key = Object.keys(mockCategoryThreads).find(
        (k) => k === resolvedCategorySlug || k.includes(resolvedCategorySlug)
      );
      if (key && mockCategoryThreads[key]) {
        threads = [...mockCategoryThreads[key]];
      } else {
        threads = [...mockTrendingThreads];
      }
    } else {
      threads = [...mockTrendingThreads];
    }

    if (subcategory) {
      threads = threads.filter((t) => t.subcategory === subcategory);
    }

    if (isHot) {
      threads = threads.filter((t) => t.isHot);
      if (threads.length === 0) {
        threads = [...mockTrendingThreads].slice(0, limit);
      }
    }

    // Sort mock threads
    switch (sort) {
      case "hot":
        threads.sort((a, b) => b.replies - a.replies);
        break;
      case "popular":
        threads.sort((a, b) => b.views - a.views);
        break;
      case "unreplied":
        threads.sort((a, b) => a.replies - b.replies);
        break;
      case "latest":
      default:
        break;
    }

    const total = threads.length;
    const paginated = threads.slice(offset, offset + limit);

    return {
      threads: paginated,
      total,
    };
  }

  /**
   * Retrieves a single thread along with its comments.
   */
  async getThreadById(idOrSlug: string): Promise<ThreadDetail | null> {
    try {
      const post = await apiClient.get<ForumBackendPost>(`/forum/posts/slug/${idOrSlug}`);
      if (post && post.id) {
        let comments: ForumBackendComment[] = [];
        try {
          const commentsData = await apiClient.get<ForumBackendComment[]>(
            `/forum/comments/post/${post.id}`
          );
          if (Array.isArray(commentsData)) {
            comments = commentsData;
          }
        } catch {
          // ignore comments fetch error, return post without comments
        }
        return mapBackendPostToThreadDetail(post, comments);
      }
    } catch (err) {
      console.warn(`Failed to fetch thread '${idOrSlug}' from API, searching fallback:`, err);
    }

    // Fallback in mockThreadDetails
    if (mockThreadDetails[idOrSlug]) {
      return mockThreadDetails[idOrSlug];
    }

    // Try finding by ID or title match in mockThreadDetails
    const foundDetail = Object.values(mockThreadDetails).find(
      (td) =>
        td.id === idOrSlug ||
        td.title.toLowerCase().replace(/[^a-z0-9]/g, "-").includes(idOrSlug.toLowerCase())
    );
    if (foundDetail) {
      return foundDetail;
    }

    // Try finding thread in categoryThreads and create a synthetic detail
    for (const catList of Object.values(mockCategoryThreads)) {
      const found = catList.find((t) => t.id === idOrSlug);
      if (found) {
        return {
          id: found.id,
          title: found.title,
          category: found.category,
          categoryId: found.categoryId,
          subcategory: found.subcategory || "",
          author: found.author,
          authorAvatar: found.authorAvatar,
          authorRole: "Contributor",
          authorBio: "Traveler & Alanya Community Member",
          authorPosts: 24,
          authorReputation: 450,
          authorJoinDate: "2024",
          authorLocation: "Alanya, Türkiye",
          authorBadges: ["Community Member"],
          content: found.excerpt,
          postedAt: found.postedAt,
          views: found.views,
          likes: found.likes,
          isLiked: false,
          isPinned: !!found.isPinned,
          isHot: found.isHot,
          isVerified: !!found.isVerified,
          replies: [],
        };
      }
    }

    return null;
  }

  /**
   * Creates a new forum thread.
   */
  async createThread(input: CreateThreadInput): Promise<{ id: string; slug: string; title: string }> {
    const categoryId = input.category_id || input.categoryId;
    try {
      const result = await apiClient.post<ForumBackendPost>("/forum/posts", {
        title: input.title,
        body: input.body,
        category_id: categoryId,
        post_type: input.post_type || "discussion",
      });

      if (result && (result.id || result.slug)) {
        return {
          id: result.id,
          slug: result.slug || result.id,
          title: result.title || input.title,
        };
      }
    } catch (err) {
      console.warn("Failed to create thread on backend API, generating fallback response:", err);
    }

    // Mock fallback response
    const generatedId = `th-${Date.now()}`;
    const generatedSlug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    return {
      id: generatedId,
      slug: generatedSlug || generatedId,
      title: input.title,
    };
  }

  /**
   * Creates a comment on a forum thread.
   */
  async createComment(postId: string, body: string): Promise<ThreadReply> {
    try {
      const result = await apiClient.post<ForumBackendComment>(`/forum/comments/post/${postId}`, {
        body,
      });

      if (result && result.id) {
        return {
          id: result.id,
          author: result.author?.full_name || "You",
          authorAvatar:
            result.author?.avatar_url ||
            "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait&width=100&height=100&seq=new-reply&orientation=squarish",
          authorRole: "Member",
          content: result.body,
          postedAt: "Just now",
          likes: 0,
          isLiked: false,
          parentId: null,
          replies: [],
        };
      }
    } catch (err) {
      console.warn("Failed to create comment on API, generating fallback response:", err);
    }

    return {
      id: `r-new-${Date.now()}`,
      author: "You",
      authorAvatar:
        "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait&width=100&height=100&seq=new-reply-user&orientation=squarish",
      authorRole: "New Member",
      content: body,
      postedAt: "Just now",
      likes: 0,
      isLiked: false,
      parentId: null,
      replies: [],
    };
  }

  /**
   * Toggles a like on a post or a comment.
   */
  async toggleLike(targetType: "post" | "comment", id: string): Promise<{ liked: boolean }> {
    try {
      const endpoint =
        targetType === "post"
          ? `/forum/posts/${id}/like`
          : `/forum/comments/${id}/like`;
      const response = await apiClient.post<{ liked: boolean }>(endpoint);
      if (response && typeof response.liked === "boolean") {
        return response;
      }
    } catch (err) {
      console.warn(`Failed to toggle like on ${targetType} '${id}', returning fallback:`, err);
    }

    return { liked: true };
  }

  /**
   * Increments view count for a post.
   */
  async incrementPostView(id: string): Promise<void> {
    try {
      await apiClient.post(`/forum/posts/${id}/view`);
    } catch (err) {
      console.warn(`Failed to increment view on post '${id}':`, err);
    }
  }

  /**
   * Retrieves trending/hot discussions.
   */
  async getTrendingThreads(limit = 8): Promise<CategoryThread[]> {
    const res = await this.getThreads({ isHot: true, limit });
    return res.threads;
  }
}

export const forumService = new ForumService();

export const getCategories = () => forumService.getCategories();
export const getCategoryById = (id: string) => forumService.getCategoryById(id);
export const getThreads = (options?: GetThreadsOptions) => forumService.getThreads(options);
export const getThreadById = (id: string) => forumService.getThreadById(id);
export const createThread = (input: CreateThreadInput) => forumService.createThread(input);
export const createComment = (postId: string, body: string) => forumService.createComment(postId, body);
export const toggleLike = (targetType: "post" | "comment", id: string) => forumService.toggleLike(targetType, id);
