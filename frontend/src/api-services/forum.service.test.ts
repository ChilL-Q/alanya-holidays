import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  forumService,
  formatRelativeTime,
  getCategories,
  getCategoryById,
  getThreads,
  getThreadById,
  createThread,
  createComment,
  toggleLike,
} from "./forum.service";
import { apiClient } from "@/lib/api-client";
import { categories as mockCategories } from "@/mocks/categories";
import { threadDetails as mockThreadDetails } from "@/mocks/thread-details";

describe("forum.service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("formatRelativeTime", () => {
    it("should format relative time correctly", () => {
      expect(formatRelativeTime(undefined)).toBe("recently");
      expect(formatRelativeTime(null)).toBe("recently");
      expect(formatRelativeTime("invalid-date")).toBe("invalid-date");

      const now = new Date();
      expect(formatRelativeTime(now.toISOString())).toBe("just now");

      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      expect(formatRelativeTime(tenMinutesAgo.toISOString())).toBe("10 mins ago");

      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoHoursAgo.toISOString())).toBe("2 hours ago");

      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(threeDaysAgo.toISOString())).toBe("3 days ago");
    });
  });

  describe("getCategories", () => {
    it("should return mapped categories when API returns data", async () => {
      const mockApiCategories = [
        {
          id: "cat-1",
          name: "Test Category",
          slug: "test-category",
          description: "Test description",
          sort_order: 1,
          parent_id: null,
          icon: "ri-test-line",
          image_url: "https://example.com/image.jpg",
          accent: "bg-blue-500",
          created_at: new Date().toISOString(),
          discussion_count: 42,
          children: [
            {
              id: "cat-1-1",
              name: "Subcategory 1",
              slug: "subcategory-1",
              parent_id: "cat-1",
            },
          ],
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockApiCategories);

      const result = await forumService.getCategories();
      expect(apiClient.get).toHaveBeenCalledWith("/forum/categories/tree");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("test-category");
      expect(result[0].name).toBe("Test Category");
      expect(result[0].threadCount).toBe(42);
      expect(result[0].subcategories).toContain("Subcategory 1");
    });

    it("should fall back to mock categories when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network error"));

      const result = await getCategories();
      expect(result).toEqual(mockCategories);
    });
  });

  describe("getCategoryById", () => {
    it("should return mapped category by slug when API returns data", async () => {
      const mockCategory = {
        id: "cat-1",
        name: "Food & Nightlife",
        slug: "food-nightlife",
        description: "Best dining",
        icon: "ri-restaurant-line",
        discussion_count: 50,
        children: [{ id: "sub-1", name: "Fine Dining", slug: "fine-dining" }],
      };

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockCategory);

      const result = await forumService.getCategoryById("food-nightlife");
      expect(apiClient.get).toHaveBeenCalledWith("/forum/categories/slug/food-nightlife");
      expect(result).not.toBeNull();
      expect(result?.name).toBe("Food & Nightlife");
      expect(result?.threadCount).toBe(50);
    });

    it("should fall back to mock category by ID when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Not found"));

      const result = await getCategoryById("travel-vacation");
      expect(result).not.toBeNull();
      expect(result?.id).toBe("travel-vacation");
      expect(result?.name).toBe("Travel & Vacation Planning");
    });
  });

  describe("getThreads", () => {
    it("should fetch hot posts from API when isHot is true without category", async () => {
      const mockHotPosts = [
        {
          id: "post-1",
          slug: "hot-topic",
          title: "Hot Topic in Alanya",
          body: "This is hot content",
          views_count: 500,
          likes_count: 45,
          comments_count: 12,
          created_at: new Date().toISOString(),
          category: { name: "Travel & Vacation", slug: "travel-vacation" },
          author: { full_name: "John Doe", avatar_url: "https://avatar.com/j.jpg" },
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockHotPosts);

      const result = await forumService.getThreads({ isHot: true, limit: 5 });
      expect(apiClient.get).toHaveBeenCalledWith("/forum/posts/hot", {
        params: { limit: 5 },
      });
      expect(result.threads).toHaveLength(1);
      expect(result.threads[0].title).toBe("Hot Topic in Alanya");
      expect(result.threads[0].isHot).toBe(true);
    });

    it("should fetch posts with query params from API", async () => {
      const mockPostsResponse = {
        data: [
          {
            id: "post-2",
            slug: "beach-guide",
            title: "Beach Guide",
            body: "Great beach advice",
            views_count: 120,
            likes_count: 10,
            comments_count: 4,
            created_at: new Date().toISOString(),
            category: { name: "Beaches & Nature", slug: "beaches-nature" },
            author: { full_name: "Jane Doe" },
          },
        ],
        total: 1,
      };

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockPostsResponse);

      const result = await getThreads({ categorySlug: "beaches-nature", sort: "latest" });
      expect(apiClient.get).toHaveBeenCalledWith("/forum/posts", {
        params: { categorySlug: "beaches-nature", sort: "latest", limit: 20, offset: 0 },
      });
      expect(result.threads).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.threads[0].title).toBe("Beach Guide");
    });

    it("should fall back to mock threads when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Failed to fetch"));

      const result = await getThreads({ categorySlug: "travel-vacation" });
      expect(result.threads.length).toBeGreaterThan(0);
      expect(result.threads[0].categoryId).toBe("travel-vacation");
    });
  });

  describe("getThreadById", () => {
    it("should fetch thread by slug and comments from API", async () => {
      const mockPost = {
        id: "p1",
        slug: "best-breakfast",
        title: "Best Breakfast",
        body: "Here is where to eat breakfast",
        views_count: 300,
        likes_count: 25,
        comments_count: 1,
        created_at: new Date().toISOString(),
        category: { name: "Food & Nightlife", slug: "food-nightlife" },
        author: { full_name: "Foodie" },
      };

      const mockComments = [
        {
          id: "c1",
          post_id: "p1",
          body: "Great recommendation!",
          likes_count: 5,
          created_at: new Date().toISOString(),
          author: { full_name: "Commenter" },
        },
      ];

      vi.spyOn(apiClient, "get")
        .mockResolvedValueOnce(mockPost)
        .mockResolvedValueOnce(mockComments);

      const result = await forumService.getThreadById("best-breakfast");
      expect(result).not.toBeNull();
      expect(result?.title).toBe("Best Breakfast");
      expect(result?.replies).toHaveLength(1);
      expect(result?.replies[0].content).toBe("Great recommendation!");
    });

    it("should fall back to mock thread detail when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Post not found"));

      const result = await getThreadById("t1");
      expect(result).not.toBeNull();
      expect(result?.id).toBe("t1");
      expect(result?.title).toBe(mockThreadDetails["t1"].title);
      expect(result?.replies.length).toBeGreaterThan(0);
    });
  });

  describe("createThread", () => {
    it("should send POST request to /forum/posts when API succeeds", async () => {
      const mockCreated = {
        id: "new-p1",
        slug: "my-new-post",
        title: "My New Post",
      };

      vi.spyOn(apiClient, "post").mockResolvedValueOnce(mockCreated);

      const result = await createThread({
        title: "My New Post",
        body: "This is my detailed post content",
        category_id: "travel-vacation",
      });

      expect(apiClient.post).toHaveBeenCalledWith("/forum/posts", {
        title: "My New Post",
        body: "This is my detailed post content",
        category_id: "travel-vacation",
        post_type: "discussion",
      });
      expect(result.id).toBe("new-p1");
      expect(result.slug).toBe("my-new-post");
    });

    it("should return fallback response when API fails", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("API offline"));

      const result = await createThread({
        title: "Fallback Test Post",
        body: "Some content here",
        category_id: "travel-vacation",
      });

      expect(result.title).toBe("Fallback Test Post");
      expect(result.slug).toBe("fallback-test-post");
      expect(result.id).toMatch(/^th-/);
    });
  });

  describe("createComment", () => {
    it("should send POST request to /forum/comments/post/:postId", async () => {
      const mockReply = {
        id: "c-new",
        post_id: "p1",
        body: "This is a comment",
        created_at: new Date().toISOString(),
        author: { full_name: "You" },
      };

      vi.spyOn(apiClient, "post").mockResolvedValueOnce(mockReply);

      const result = await createComment("p1", "This is a comment");
      expect(apiClient.post).toHaveBeenCalledWith("/forum/comments/post/p1", {
        body: "This is a comment",
      });
      expect(result.id).toBe("c-new");
      expect(result.content).toBe("This is a comment");
    });

    it("should return fallback reply when API fails", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Offline"));

      const result = await createComment("p1", "Offline comment test");
      expect(result.content).toBe("Offline comment test");
      expect(result.id).toMatch(/^r-new-/);
    });
  });

  describe("toggleLike", () => {
    it("should toggle post like via API", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ liked: true });

      const result = await toggleLike("post", "p123");
      expect(apiClient.post).toHaveBeenCalledWith("/forum/posts/p123/like");
      expect(result.liked).toBe(true);
    });

    it("should toggle comment like via API", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ liked: false });

      const result = await toggleLike("comment", "c123");
      expect(apiClient.post).toHaveBeenCalledWith("/forum/comments/c123/like");
      expect(result.liked).toBe(false);
    });

    it("should return fallback liked state when API fails", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Offline"));

      const result = await toggleLike("post", "p123");
      expect(result.liked).toBe(true);
    });
  });
});
