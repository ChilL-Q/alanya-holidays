import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  forumService,
  getCategories,
  getCategoryById,
  getForumStats,
  getThreads,
  getThreadById,
  createThread,
  createComment,
  toggleLikePost,
  toggleLikeComment,
  toggleBookmark,
  getBookmarkedPosts,
  updatePost,
  updateComment,
} from "./forum.service";
import { apiClient, ApiError } from "@/lib/api-client";

describe("forum.service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
      expect(result[0].id).toBe("cat-1");
      expect(result[0].slug).toBe("test-category");
      expect(result[0].name).toBe("Test Category");
      expect(result[0].threadCount).toBe(42);
      expect(result[0].subcategories).toContain("Subcategory 1");
    });

    it("should return empty array on 404 ApiError", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Not found", 404, "Not Found")
      );

      const result = await getCategories();
      expect(result).toEqual([]);
    });

    it("should propagate ApiError when 500 occurs", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Server Error", 500, "Internal Server Error")
      );

      await expect(getCategories()).rejects.toThrow(ApiError);
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

    it("should return null on 404 ApiError", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Not found", 404, "Not Found")
      );

      const result = await getCategoryById("travel-vacation");
      expect(result).toBeNull();
    });
  });

  describe("getForumStats", () => {
    it("should return aggregated stats from GET /forum/stats", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({
        totalPosts: 120,
        totalMembers: 450,
        totalComments: 890,
        localExperts: 15,
        totalCategories: 8,
      });

      const stats = await getForumStats();
      expect(apiClient.get).toHaveBeenCalledWith("/forum/stats");
      expect(stats.totalDiscussions).toBe(120);
      expect(stats.activeMembers).toBe(450);
      expect(stats.questionsAnswered).toBe(890);
      expect(stats.localExperts).toBe(15);
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

    it("should throw ApiError when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Failed to fetch", 500, "Internal Server Error")
      );

      await expect(getThreads({ categorySlug: "travel-vacation" })).rejects.toThrow(ApiError);
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
      expect(result?.category).toBe("Food & Nightlife");
      expect(result?.subcategory).toBeUndefined();
      expect(result?.replies).toHaveLength(1);
      expect(result?.replies[0].content).toBe("Great recommendation!");
    });

    it("should map backend child categories as parent category plus subcategory", async () => {
      const mockPost = {
        id: "p2",
        slug: "best-clinics",
        title: "Best clinics in Oba",
        body: "Looking for recommendations",
        views_count: 80,
        likes_count: 3,
        comments_count: 0,
        created_at: new Date().toISOString(),
        category: {
          id: "cat-child",
          name: "Dentists",
          slug: "dentists",
          parent_id: "cat-parent",
          parent: {
            id: "cat-parent",
            name: "Living",
            slug: "living",
          },
        },
        author: { full_name: "Member" },
      };

      vi.spyOn(apiClient, "get")
        .mockResolvedValueOnce(mockPost)
        .mockResolvedValueOnce([]);

      const result = await forumService.getThreadById("best-clinics");
      expect(result).not.toBeNull();
      expect(result?.category).toBe("Living");
      expect(result?.categoryId).toBe("living");
      expect(result?.subcategory).toBe("Dentists");
    });

    it("should return null on 404 ApiError", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Post not found", 404, "Not Found")
      );

      const result = await getThreadById("t1");
      expect(result).toBeNull();
    });
  });

  describe("createThread", () => {
    it("should send POST request to /forum/posts when API succeeds", async () => {
      const mockCreated = {
        id: "new-p1",
        slug: "my-new-post",
        title: "My New Post",
        body: "This is my detailed post content",
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

    it("should throw ApiError when createThread API fails", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(
        new ApiError("API offline", 500, "Internal Server Error")
      );

      await expect(
        createThread({
          title: "Fallback Test Post",
          body: "Some content here",
          category_id: "travel-vacation",
        })
      ).rejects.toThrow(ApiError);
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

      const result = await createComment({ postId: "p1", body: "This is a comment" });
      expect(apiClient.post).toHaveBeenCalledWith("/forum/comments/post/p1", {
        body: "This is a comment",
        parentId: null,
        parent_id: null,
      });
      expect(result.id).toBe("c-new");
      expect(result.content).toBe("This is a comment");
    });
  });

  describe("toggleLikePost and toggleLikeComment", () => {
    it("should toggle post like via API", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ liked: true, likesCount: 5 });

      const result = await toggleLikePost("p123");
      expect(apiClient.post).toHaveBeenCalledWith("/forum/posts/p123/like");
      expect(result.liked).toBe(true);
    });

    it("should toggle comment like via API", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ liked: false, likesCount: 2 });

      const result = await toggleLikeComment("c123");
      expect(apiClient.post).toHaveBeenCalledWith("/forum/comments/c123/like");
      expect(result.liked).toBe(false);
    });
  });
  describe("toggleBookmark", () => {
    it("should toggle bookmark via POST /forum/posts/:id/bookmark", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ bookmarked: true });

      const result = await toggleBookmark("p123");
      expect(apiClient.post).toHaveBeenCalledWith("/forum/posts/p123/bookmark");
      expect(result.bookmarked).toBe(true);
    });
  });

  describe("getBookmarkedPosts", () => {
    it("should retrieve bookmarked posts mapped to CategoryThread", async () => {
      const mockBookmarked = [
        {
          id: "bm-1",
          slug: "saved-discussion",
          title: "Saved Discussion",
          body: "Some saved content",
          bookmarked_by_me: true,
          created_at: new Date().toISOString(),
          category: { name: "Living & Expat", slug: "living-expat" },
          author: { full_name: "Expat User" },
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockBookmarked);

      const result = await getBookmarkedPosts(10);
      expect(apiClient.get).toHaveBeenCalledWith("/forum/bookmarks", {
        params: { limit: 10 },
      });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Saved Discussion");
      expect(result[0].isBookmarked).toBe(true);
    });

    it("should return empty array on 404 ApiError", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Not found", 404, "Not Found")
      );

      const result = await getBookmarkedPosts();
      expect(result).toEqual([]);
    });
  });

  describe("updatePost and updateComment", () => {
    it("should update post via PUT /forum/posts/:id", async () => {
      const mockUpdated = {
        id: "p-edit",
        slug: "edited-post",
        title: "Edited Title",
        body: "Updated content",
      };

      vi.spyOn(apiClient, "put").mockResolvedValueOnce(mockUpdated);

      const result = await updatePost("p-edit", { body: "Updated content" });
      expect(apiClient.put).toHaveBeenCalledWith("/forum/posts/p-edit", {
        body: "Updated content",
      });
      expect(result.id).toBe("p-edit");
    });

    it("should update comment via PUT /forum/comments/:id", async () => {
      const mockUpdatedComment = {
        id: "c-edit",
        post_id: "p1",
        body: "Updated comment text",
      };

      vi.spyOn(apiClient, "put").mockResolvedValueOnce(mockUpdatedComment);

      const result = await updateComment("c-edit", "Updated comment text");
      expect(apiClient.put).toHaveBeenCalledWith("/forum/comments/c-edit", {
        body: "Updated comment text",
      });
      expect(result.id).toBe("c-edit");
      expect(result.content).toBe("Updated comment text");
    });
  });

});
