import { apiClient, ApiError, type RequestOptions } from "@/lib/api-client";
import { logger } from "@/lib/logger";

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  threadCount: number;
  memberCount: number;
  subcategories: string[];
  color: string;
  image: string;
  slug?: string;
}

export interface CategoryThread {
  id: string;
  title: string;
  category: string;
  categoryId: string;
  author: string;
  authorAvatar: string;
  replies: number;
  views: number;
  likes: number;
  postedAt: string;
  isHot: boolean;
  excerpt: string;
  subcategory?: string;
  isPinned?: boolean;
  isVerified?: boolean;
  isLiked?: boolean;
  isBookmarked?: boolean;
  authorId?: string;
  slug?: string;
  imageUrl?: string;
  categoryImageUrl?: string;
}

export interface ThreadReply {
  id: string;
  author: string;
  authorAvatar: string;
  authorId?: string;
  authorRole: string;
  authorBadges: string[];
  content: string;
  postedAt: string;
  likes: number;
  isLiked?: boolean;
  isOriginalPoster?: boolean;
  parentId?: string | null;
  replies: ThreadReply[];
}

export interface ThreadDetail {
  id: string;
  title: string;
  category: string;
  categoryId: string;
  subcategory?: string;
  author: string;
  authorAvatar: string;
  authorRole: string;
  authorBio: string;
  authorPosts: number;
  authorReputation: number;
  authorJoinDate: string;
  authorLocation: string;
  authorBadges: string[];
  content: string;
  postedAt: string;
  views: number;
  likes: number;
  isLiked: boolean;
  isBookmarked?: boolean;
  authorId?: string;
  isPinned: boolean;
  isHot: boolean;
  isVerified: boolean;
  replies: ThreadReply[];
  slug?: string;
  imageUrl?: string;
  categoryImageUrl?: string;
}

export interface ForumMember {
  id: string;
  username: string;
  fullName: string;
  role: string;
  location: string;
  joinDate: string;
  posts: number;
  reputation: number;
  isOnline: boolean;
  avatar: string;
  bio: string;
  badges: string[];
}

export type Member = ForumMember;

export interface BackendForumMember {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  bio?: string | null;
  created_at?: string | null;
  last_seen_at?: string | null;
  social_links?: Record<string, string> | null;
  post_count?: number;
  is_online?: boolean;
}

export const memberBadges: string[] = [
  "Local Expert",
  "Beach Guide",
  "Food Critic",
  "Event Organizer",
  "Digital Nomad",
  "Mentor",
  "Business Owner",
  "Real Estate Expert",
  "Verified Local",
  "History Expert",
  "Tour Guide",
  "Cultural Ambassador",
  "Photographer",
  "Adventure Guide",
  "Content Creator",
  "New Member",
  "Rising Star",
  "Legal Expert",
  "Wellness Expert",
  "Family Expert",
  "Tech Expert",
];

export const memberRoles: string[] = [
  "Top Contributor",
  "Community Leader",
  "Verified Local",
  "Rising Star",
  "Real Estate Expert",
  "Cultural Ambassador",
  "Content Creator",
  "Wellness Guide",
  "Legal Advisor",
  "Photographer",
  "Family Expert",
  "Tech Expert",
  "Adventure Guide",
  "Food Expert",
];

export const badgeDescriptions: Record<string, { icon: string; description: string; color: string }> = {
  "Local Expert": {
    icon: "ri-map-pin-2-line",
    description: "Recognized by the community for deep local knowledge of Alanya and the Antalya region.",
    color: "bg-accent-100 text-accent-700",
  },
  "Beach Guide": {
    icon: "ri-anchor-line",
    description: "Knows every beach, cove, and swimming spot along the Alanya coastline.",
    color: "bg-primary-100 text-primary-700",
  },
  "Food Critic": {
    icon: "ri-restaurant-2-line",
    description: "Trusted voice on the local food scene — from street eats to fine dining.",
    color: "bg-secondary-100 text-secondary-800",
  },
  "Event Organizer": {
    icon: "ri-calendar-event-line",
    description: "Hosts and organizes community meetups, workshops, and social gatherings.",
    color: "bg-accent-100 text-accent-700",
  },
  "Digital Nomad": {
    icon: "ri-macbook-line",
    description: "Remote worker sharing insights on coworking, Wi-Fi spots, and nomad life.",
    color: "bg-primary-100 text-primary-700",
  },
  "Mentor": {
    icon: "ri-user-star-line",
    description: "Actively helps newcomers navigate living, renting, and settling in Alanya.",
    color: "bg-secondary-100 text-secondary-800",
  },
  "Business Owner": {
    icon: "ri-store-2-line",
    description: "Verified local business operator contributing expertise to the community.",
    color: "bg-accent-100 text-accent-700",
  },
  "Real Estate Expert": {
    icon: "ri-home-4-line",
    description: "Specialist in the Alanya property market, rentals, and residency requirements.",
    color: "bg-primary-100 text-primary-700",
  },
  "Verified Local": {
    icon: "ri-shield-check-line",
    description: "Long-term resident verified by the community moderation team.",
    color: "bg-accent-100 text-accent-700",
  },
};

export interface ForumStats {
  totalDiscussions: number;
  activeMembers: number;
  questionsAnswered: number;
  localExperts: number;
  totalPosts?: number;
  totalMembers?: number;
  totalCategories?: number;
  totalComments?: number;
}

export interface GetThreadsOptions extends RequestOptions {
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
  image_url?: string;
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
  image_url?: string | null;
  category_id?: string;
  author_id?: string;
  post_type?: "discussion" | "question";
  views_count?: number;
  view_count?: number;
  likes_count?: number;
  like_count?: number;
  comments_count?: number;
  comment_count?: number;
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
    bio?: string | null;
    role?: string | null;
    created_at?: string | null;
  };
  liked_by_me?: boolean;
  is_liked?: boolean;
  bookmarked_by_me?: boolean;
  is_bookmarked?: boolean;
}

export interface ForumBackendComment {
  id: string;
  post_id: string;
  author_id?: string;
  body: string;
  likes_count?: number;
  like_count?: number;
  is_removed?: boolean;
  created_at?: string;
  updated_at?: string;
  author?: {
    full_name?: string;
    avatar_url?: string;
  };
  liked_by_me?: boolean;
  is_liked?: boolean;
  parent_id?: string | null;
}

function timeAgo(dateString?: string | null): string {
  if (!dateString) return "Recently";
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
}

export function mapBackendCategoryToCategory(cat: ForumBackendCategory): Category {
  const subcategories = Array.isArray(cat.children)
    ? cat.children.map((c) => c.name)
    : [];

  return {
    id: cat.id || cat.slug,
    name: cat.name,
    icon: cat.icon || "ri-chat-3-line",
    description: cat.description || "Discussions and questions in this category",
    threadCount: cat.topic_count ?? cat.discussion_count ?? 0,
    memberCount: Math.max(10, Math.floor((cat.topic_count ?? 10) * 1.5)),
    subcategories,
    color: cat.accent || "from-primary-500 to-primary-700",
    image:
      cat.image_url ||
      "/images/placeholder-business.svg",
    slug: cat.slug || cat.id,
  };
}

export function mapBackendPostToThread(post: ForumBackendPost): CategoryThread {
  const defaultAvatar =
    "/images/placeholder-business.svg";

  const repliesCount = post.comments_count ?? post.comment_count ?? 0;
  const viewsCount = post.views_count ?? post.view_count ?? 0;
  const likesCount = post.likes_count ?? post.like_count ?? 0;
  const isHot = viewsCount > 100 || repliesCount > 10;
  const postBody = post.body || "";
  const clean = postBody.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

  const cat = post.category;
  const hasParent = Boolean(cat?.parent_id || cat?.parent);
  const parentCat = cat?.parent;

  const categoryName = hasParent
    ? (parentCat?.name || "General")
    : (cat?.name || "General");

  const categorySlug = hasParent
    ? (parentCat?.slug || "general")
    : (cat?.slug || post.category_id || "general");

  const subcategoryName = hasParent ? cat?.name : undefined;

  return {
    id: post.id,
    title: post.title,
    category: categoryName,
    categoryId: categorySlug,
    subcategory: subcategoryName,
    author: post.author?.full_name || "Alanya Member",
    authorAvatar: post.author?.avatar_url || defaultAvatar,
    replies: repliesCount,
    views: viewsCount,
    likes: likesCount,
    postedAt: timeAgo(post.created_at),
    isHot,
    excerpt:
      clean.length > 150 ? `${clean.slice(0, 150).trim()}...` : clean,
    isPinned: !!post.is_pinned,
    isVerified: true,
    isLiked: !!(post.liked_by_me || post.is_liked),
    isBookmarked: !!(post.bookmarked_by_me || post.is_bookmarked),
    authorId: post.author_id,
    slug: post.slug || post.id,
    imageUrl: post.image_url || undefined,
    categoryImageUrl: (hasParent ? parentCat?.image_url : cat?.image_url) || undefined,
  };
}

export function mapBackendCommentToReply(comment: ForumBackendComment): ThreadReply {  const defaultAvatar =
    "/images/placeholder-business.svg";

  return {
    id: comment.id,
    author: comment.author?.full_name || "Community Member",
    authorAvatar: comment.author?.avatar_url || defaultAvatar,
    authorRole: "Contributor",
    authorBadges: ["Community Member"],
    content: comment.body,
    postedAt: timeAgo(comment.created_at),
    likes: comment.likes_count ?? comment.like_count ?? 0,
    isLiked: !!(comment.liked_by_me || comment.is_liked),
    authorId: comment.author_id,
    parentId: comment.parent_id || null,
    replies: [],
  };
}

export function mapBackendPostToThreadDetail(
  post: ForumBackendPost,
  comments: ForumBackendComment[] = []
): ThreadDetail {
  const defaultAvatar =
    "/images/placeholder-business.svg";

  const replies = comments.map(mapBackendCommentToReply);
  const repliesCount = post.comments_count ?? post.comment_count ?? comments.length;
  const viewsCount = post.views_count ?? post.view_count ?? 0;
  const likesCount = post.likes_count ?? post.like_count ?? 0;
  const isHot = viewsCount > 100 || repliesCount > 10;

  const cat = post.category;
  const hasParent = Boolean(cat?.parent_id || cat?.parent);
  const parentCat = cat?.parent;

  const categoryName = hasParent
    ? (parentCat?.name || "General")
    : (cat?.name || "General");

  const categorySlug = hasParent
    ? (parentCat?.slug || "general")
    : (cat?.slug || post.category_id || "general");

  const subcategoryName = hasParent ? (cat?.name || undefined) : undefined;

  const authorRole =
    post.author?.role === "admin"
      ? "Administrator"
      : post.author?.role === "merchant"
      ? "Verified Partner"
      : "Discussion Starter";

  const authorJoinYear = post.author?.created_at
    ? new Date(post.author.created_at).getFullYear().toString()
    : "2024";

  const authorBio =
    post.author?.bio?.trim() || "Alanya Community Member & Traveler";

  const authorBadges: string[] = [];
  if (post.author?.role === "admin") {
    authorBadges.push("Admin", "Verified");
  } else if (post.author?.role === "merchant") {
    authorBadges.push("Partner", "Verified");
  } else {
    authorBadges.push("Verified Traveler");
  }

  return {
    id: post.id,
    title: post.title,
    category: categoryName,
    categoryId: categorySlug,
    subcategory: subcategoryName,
    author: post.author?.full_name || "Community Member",
    authorAvatar: post.author?.avatar_url || defaultAvatar,
    authorRole,
    authorBio,
    authorPosts: Math.max(1, repliesCount),
    authorReputation: likesCount * 10 + 50,
    authorJoinDate: authorJoinYear,
    authorLocation: "Alanya, Türkiye",
    authorBadges,
    content: post.body,
    postedAt: timeAgo(post.created_at),
    views: viewsCount,
    likes: likesCount,
    isLiked: !!(post.liked_by_me || post.is_liked),
    isBookmarked: !!(post.bookmarked_by_me || post.is_bookmarked),
    authorId: post.author_id,
    isPinned: !!post.is_pinned,
    isHot,
    isVerified: true,
    replies,
    slug: post.slug,
    imageUrl: post.image_url || undefined,
    categoryImageUrl: (hasParent ? parentCat?.image_url : cat?.image_url) || undefined,
  };
}

export function mapBackendMemberToForumMember(
  raw: BackendForumMember
): ForumMember {
  const defaultAvatar =
    "/images/placeholder-business.svg";

  const usernameBase = raw.full_name?.trim().toLowerCase().replace(/\s+/g, "_");

  return {
    id: raw.id,
    username: usernameBase || `member_${raw.id.slice(0, 6)}`,
    fullName: raw.full_name || "Alanya Member",
    role: raw.role || "member",
    location: "",
    joinDate: raw.created_at?.slice(0, 10) || "",
    posts: raw.post_count ?? 0,
    reputation: 0,
    isOnline: !!raw.is_online,
    avatar: raw.avatar_url || defaultAvatar,
    bio: raw.bio || "",
    badges: [],
  };
}

export class ForumService {
  /**
   * Retrieves the raw forum category tree directly from backend.
   */
  async getCategoryTree(options?: RequestOptions): Promise<ForumBackendCategory[]> {
    try {
      const data = options
        ? await apiClient.get<ForumBackendCategory[]>("/forum/categories/tree", options)
        : await apiClient.get<ForumBackendCategory[]>("/forum/categories/tree");
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }

      const flatData = options
        ? await apiClient.get<ForumBackendCategory[]>("/forum/categories", options)
        : await apiClient.get<ForumBackendCategory[]>("/forum/categories");
      if (Array.isArray(flatData)) {
        return flatData.filter((c) => !c.parent_id);
      }
      return [];
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return [];
      }
      throw err;
    }
  }

  /**
   * Retrieves forum categories directly from backend.
   */
  async getCategories(options?: RequestOptions): Promise<Category[]> {
    const data = await this.getCategoryTree(options);
    return data.map(mapBackendCategoryToCategory);
  }

  /**
   * Retrieves a single category by its slug or ID.
   */
  async getCategoryById(idOrSlug: string, options?: RequestOptions): Promise<Category | null> {
    try {
      const data = options
        ? await apiClient.get<ForumBackendCategory>(`/forum/categories/slug/${idOrSlug}`, options)
        : await apiClient.get<ForumBackendCategory>(`/forum/categories/slug/${idOrSlug}`);
      if (data && data.id) {
        return mapBackendCategoryToCategory(data);
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
   * Retrieves aggregated forum stats from backend GET /forum/stats.
   */
  async getForumStats(options?: RequestOptions): Promise<ForumStats> {
    const data = options
      ? await apiClient.get<Record<string, number>>("/forum/stats", options)
      : await apiClient.get<Record<string, number>>("/forum/stats");
    return {
      totalDiscussions: data.totalPosts ?? data.totalDiscussions ?? 0,
      activeMembers: data.totalMembers ?? data.activeMembers ?? 0,
      questionsAnswered: data.totalComments ?? data.questionsAnswered ?? 0,
      localExperts: data.localExperts ?? 0,
      totalPosts: data.totalPosts,
      totalMembers: data.totalMembers,
      totalCategories: data.totalCategories,
      totalComments: data.totalComments,
    };
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
      params: extraParams,
      ...reqConfig
    } = options;

    const resolvedCategorySlug = categorySlug || categoryId;

    if (isHot && !resolvedCategorySlug) {
      const hotData = await apiClient.get<ForumBackendPost[]>("/forum/posts/hot", {
        ...reqConfig,
        params: { ...extraParams, limit },
      });
      if (Array.isArray(hotData)) {
        const threads = hotData.map(mapBackendPostToThread);
        return { threads, total: threads.length };
      }
    }

    const params: Record<string, string | number | boolean | undefined> = {
      sort,
      limit,
      offset,
    };
    if (resolvedCategorySlug && resolvedCategorySlug !== "all") {
      params.categorySlug = resolvedCategorySlug;
    }
    if (postType) params.postType = postType;

    const response = await apiClient.get<{ data: ForumBackendPost[]; total: number }>(
      "/forum/posts",
      {
        ...reqConfig,
        params: { ...extraParams, ...params },
      }
    );

    if (response && Array.isArray(response.data)) {
      let threads = response.data.map(mapBackendPostToThread);
      if (subcategory) {
        threads = threads.filter((t) => t.subcategory === subcategory);
      }
      return {
        threads,
        total: response.total ?? threads.length,
      };
    }

    return {
      threads: [],
      total: 0,
    };
  }

  /**
   * Retrieves trending/hot threads.
   */
  async getTrendingThreads(limit: number = 8, options?: RequestOptions): Promise<CategoryThread[]> {
    const res = await this.getThreads({ ...options, sort: "hot", limit, isHot: true });
    return res.threads;
  }

  /**
   * Retrieves hot discussions.
   */
  async getHotDiscussions(limit: number = 8, options?: RequestOptions): Promise<CategoryThread[]> {
    const res = await this.getThreads({ ...options, sort: "hot", limit, isHot: true });
    return res.threads;
  }

  /**
   * Retrieves a single thread along with its comments.
   */
  async getThreadById(idOrSlug: string, options?: RequestOptions): Promise<ThreadDetail | null> {
    try {
      const post = options
        ? await apiClient.get<ForumBackendPost>(`/forum/posts/slug/${idOrSlug}`, options)
        : await apiClient.get<ForumBackendPost>(`/forum/posts/slug/${idOrSlug}`);
      if (post && post.id) {
        let comments: ForumBackendComment[] = [];
        try {
          const commentsData = options
            ? await apiClient.get<ForumBackendComment[]>(
                `/forum/comments/post/${post.id}`,
                options
              )
            : await apiClient.get<ForumBackendComment[]>(
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
      return null;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Creates a new thread/post in the forum.
   */
  async createThread(input: CreateThreadInput): Promise<CategoryThread> {
    const response = await apiClient.post<ForumBackendPost>("/forum/posts", {
      title: input.title,
      body: input.body,
      category_id: input.category_id || input.categoryId,
      subcategory: input.subcategory,
      post_type: input.post_type || "discussion",
      image_url: input.image_url,
    });

    return mapBackendPostToThread(response);
  }

  /**
   * Increments the view count on a thread.
   */
  async incrementPostView(postId: string): Promise<void> {
    try {
      await apiClient.post(`/forum/posts/${postId}/view`, {});
    } catch {
      // silent
    }
  }

  /**
   * Toggles like on a thread/post.
   */
  async toggleLikePost(postId: string): Promise<{ liked: boolean; likesCount: number }> {
    return apiClient.post<{ liked: boolean; likesCount: number }>(
      `/forum/posts/${postId}/like`
    );
  }

  /**
   * Creates a new comment/reply on a post.
   */
  async createComment(
    inputOrPostId: CreateCommentInput | string,
    content?: string,
    parentId?: string | null
  ): Promise<ThreadReply> {
    const input: CreateCommentInput =
      typeof inputOrPostId === "string"
        ? { postId: inputOrPostId, body: content || "", parentId }
        : inputOrPostId;

    const response = await apiClient.post<ForumBackendComment>(
      `/forum/comments/post/${input.postId}`,
      {
        body: input.body,
        parentId: input.parentId || null,
        parent_id: input.parentId || null,
      }
    );

    return mapBackendCommentToReply(response);
  }

  /**
   * Toggles like on a comment.
   */
  async toggleLikeComment(commentId: string): Promise<{ liked: boolean; likesCount: number }> {
    return apiClient.post<{ liked: boolean; likesCount: number }>(
      `/forum/comments/${commentId}/like`
    );
  }

  /**
   * General toggle like for posts or comments.
   */
  async toggleLike(
    targetType: "post" | "comment",
    targetId: string
  ): Promise<{ liked: boolean; likesCount: number }> {
    if (targetType === "post") {
      return this.toggleLikePost(targetId);
    }
    return this.toggleLikeComment(targetId);
  }

  /**
   * Retrieves forum community members.
   */
  async getMembers(
    options?: { role?: string; limit?: number } & RequestOptions
  ): Promise<ForumMember[]> {
    try {
      const { role, limit, ...reqConfig } = options || {};
      const params: Record<string, string | number | undefined> = {};
      if (role && role !== "all") params.role = role;
      if (limit) params.limit = limit;

      const response = await apiClient.get<
        BackendForumMember[] | { data: BackendForumMember[] }
      >("/forum/members", {
        ...reqConfig,
        params: { ...reqConfig.params, ...params },
      });
      if (Array.isArray(response)) return response.map(mapBackendMemberToForumMember);
      if (
        response &&
        Array.isArray((response as { data: BackendForumMember[] }).data)
      ) {
        return (response as { data: BackendForumMember[] }).data.map(
          mapBackendMemberToForumMember
        );
      }
      return [];
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 401)) {
        return [];
      }
      throw err;
    }
  }

  /**
   * Retrieves a single forum community member by ID.
   */
  async getMemberById(memberId: string, options?: RequestOptions): Promise<ForumMember | null> {
    try {
      const response = options
        ? await apiClient.get<BackendForumMember | { data: BackendForumMember }>(
            `/forum/members/${encodeURIComponent(memberId)}`,
            options
          )
        : await apiClient.get<BackendForumMember | { data: BackendForumMember }>(
            `/forum/members/${encodeURIComponent(memberId)}`
          );
      const raw =
        response && "data" in response && (response as { data: BackendForumMember }).data
          ? (response as { data: BackendForumMember }).data
          : (response as BackendForumMember);
      if (!raw || !raw.id) return null;
      return mapBackendMemberToForumMember(raw);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  }
  /**
   * Toggles bookmark on a thread/post.
   */
  async toggleBookmark(postId: string): Promise<{ bookmarked: boolean }> {
    return apiClient.post<{ bookmarked: boolean }>(
      `/forum/posts/${postId}/bookmark`
    );
  }

  /**
   * Retrieves bookmarked posts for the current user.
   */
  async getBookmarkedPosts(
    limit: number = 20,
    options?: RequestOptions
  ): Promise<CategoryThread[]> {
    try {
      const data = await apiClient.get<ForumBackendPost[] | { data: ForumBackendPost[] }>(
        "/forum/bookmarks",
        {
          ...options,
          params: { ...options?.params, limit },
        }
      );
      if (Array.isArray(data)) {
        return data.map(mapBackendPostToThread);
      }
      if (data && "data" in data && Array.isArray((data as { data: ForumBackendPost[] }).data)) {
        return (data as { data: ForumBackendPost[] }).data.map(mapBackendPostToThread);
      }
      return [];
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 401)) {
        return [];
      }
      throw err;
    }
  }

  /**
   * Alias for getBookmarkedPosts.
   */
  async getBookmarkedThreads(
    limit: number = 20,
    options?: RequestOptions
  ): Promise<CategoryThread[]> {
    return this.getBookmarkedPosts(limit, options);
  }

  /**
   * Updates an existing forum post.
   */
  async updatePost(
    postId: string,
    data: { title?: string; body?: string; image_url?: string | null }
  ): Promise<CategoryThread> {
    const response = await apiClient.put<ForumBackendPost>(
      `/forum/posts/${postId}`,
      data
    );
    return mapBackendPostToThread(response);
  }

  /**
   * Updates an existing forum comment/reply.
   */
  async updateComment(
    commentId: string,
    data: { body: string } | string
  ): Promise<ThreadReply> {
    const body = typeof data === "string" ? { body: data } : data;
    const response = await apiClient.put<ForumBackendComment>(
      `/forum/comments/${commentId}`,
      body
    );
    return mapBackendCommentToReply(response);
  }

  /**
   * Reports a forum post or comment.
   */
  async reportContent(targetType: "post" | "comment", targetId: string, reason: string): Promise<boolean> {
    try {
      await apiClient.post("/forum/reports", {
        target_type: targetType,
        target_id: targetId,
        reason,
      });
      return true;
    } catch (err) {
      logger.error("Failed to report content:", err);
      return false;
    }
  }
}

export const forumService = new ForumService();

export const getCategoryTree = (options?: RequestOptions) => forumService.getCategoryTree(options);
export const getCategories = (options?: RequestOptions) => forumService.getCategories(options);
export const getCategoryById = (idOrSlug: string, options?: RequestOptions) =>
  forumService.getCategoryById(idOrSlug, options);
export const getForumStats = (options?: RequestOptions) => forumService.getForumStats(options);
export const getThreads = (options?: GetThreadsOptions) => forumService.getThreads(options);
export const getThreadById = (idOrSlug: string, options?: RequestOptions) =>
  forumService.getThreadById(idOrSlug, options);
export const createThread = (input: CreateThreadInput) => forumService.createThread(input);
export const toggleLikePost = (postId: string) => forumService.toggleLikePost(postId);
export const createComment = (input: CreateCommentInput) => forumService.createComment(input);
export const toggleLikeComment = (commentId: string) => forumService.toggleLikeComment(commentId);
export const getMembers = (options?: { role?: string; limit?: number } & RequestOptions) =>
  forumService.getMembers(options);
export const getMemberById = (memberId: string, options?: RequestOptions) =>
  forumService.getMemberById(memberId, options);

export const toggleBookmark = (postId: string) => forumService.toggleBookmark(postId);
export const getBookmarkedPosts = (limit?: number, options?: RequestOptions) =>
  forumService.getBookmarkedPosts(limit, options);
export const getBookmarkedThreads = (limit?: number, options?: RequestOptions) =>
  forumService.getBookmarkedThreads(limit, options);
export const updatePost = (
  postId: string,
  data: { title?: string; body?: string; image_url?: string | null },
) =>
  forumService.updatePost(postId, data);
export const updateComment = (commentId: string, data: { body: string } | string) =>
  forumService.updateComment(commentId, data);
export const reportContent = (targetType: "post" | "comment", targetId: string, reason: string) =>
  forumService.reportContent(targetType, targetId, reason);
