import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  blogService,
  getPosts,
  getPostBySlug,
  getFeaturedPosts,
  getTags,
  submitGuide,
  getGuideContent,
} from "./blog.service";
import { apiClient, ApiError } from "@/lib/api-client";

describe("blog.service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getPosts", () => {
    it("should return mapped posts and total when API returns object with data and total", async () => {
      const mockBackendResponse = {
        data: [
          {
            id: "post-101",
            title: "Exploring Damlatas Cave",
            slug: "exploring-damlatas-cave",
            excerpt: "A deep dive into Damlatas cave climate and history.",
            content: "Full content here...",
            category: "Adventure",
            cover_image_url: "https://example.com/damlatas.jpg",
            is_featured: true,
            view_count: 50,
            published_at: "2026-06-01T10:00:00Z",
            tags: [{ id: "tag-3", name: "Adventure", slug: "adventure" }],
          },
        ],
        total: 1,
      };

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockBackendResponse);

      const result = await blogService.getPosts({ category: "Adventure", limit: 5 });
      expect(apiClient.get).toHaveBeenCalledWith("/blog/posts", {
        params: { category: "Adventure", limit: 5 },
      });
      expect(result.total).toBe(1);
      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].id).toBe("post-101");
      expect(result.posts[0].title).toBe("Exploring Damlatas Cave");
      expect(result.posts[0].tag).toBe("Adventure");
    });

    it("should return mapped posts when API returns an array", async () => {
      const mockBackendArray = [
        {
          id: "post-102",
          title: "Top 5 Rooftops in Alanya",
          slug: "top-5-rooftops-in-alanya",
          excerpt: "Best nightlife spots for golden hour cocktails.",
          category: "Nightlife",
          cover_image_url: "https://example.com/rooftop.jpg",
          is_featured: false,
          view_count: 120,
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockBackendArray);

      const result = await getPosts({ search: "rooftops" });
      expect(result.total).toBe(1);
      expect(result.posts[0].title).toBe("Top 5 Rooftops in Alanya");
      expect(result.posts[0].tag).toBe("Nightlife");
    });

    it("should throw ApiError when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("API offline", 500, "Internal Server Error")
      );

      await expect(getPosts()).rejects.toThrow(ApiError);
    });
  });

  describe("getPostBySlug", () => {
    it("should return mapped post detail when API returns post", async () => {
      const mockPost = {
        id: "post-201",
        title: "Dim River Floating Restaurants",
        slug: "dim-river-floating-restaurants",
        content: "Escape the heat at Dim River with tables placed over flowing mountain water.",
        excerpt: "Escape the heat at Dim River.",
        category: "Adventure",
        cover_image_url: "https://example.com/dimcay.jpg",
        published_at: "2026-07-01T12:00:00Z",
        author: {
          id: "author-1",
          full_name: "Tarik Kaya",
          avatar_url: "https://example.com/tarik.jpg",
        },
        tags: [{ id: "tag-3", name: "Adventure", slug: "adventure" }],
      };

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockPost);

      const result = await blogService.getPostBySlug("dim-river-floating-restaurants");
      expect(apiClient.get).toHaveBeenCalledWith("/blog/post/dim-river-floating-restaurants");
      expect(result).not.toBeNull();
      expect(result?.title).toBe("Dim River Floating Restaurants");
      expect(result?.author?.full_name).toBe("Tarik Kaya");
    });

    it("should return null on 404 ApiError", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Post not found", 404, "Not Found")
      );

      const result = await getPostBySlug("non-existent-article-xyz-999");
      expect(result).toBeNull();
    });

    it("should propagate ApiError when 500 occurs", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Internal error", 500, "Internal Server Error")
      );

      await expect(getPostBySlug("error-slug")).rejects.toThrow(ApiError);
    });
  });

  describe("getFeaturedPosts", () => {
    it("should return featured posts from API", async () => {
      const mockFeatured = [
        {
          id: "post-f1",
          title: "Featured 1",
          slug: "featured-1",
          category: "Essential",
          is_featured: true,
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockFeatured);

      const result = await blogService.getFeaturedPosts(3);
      expect(apiClient.get).toHaveBeenCalledWith("/blog/featured", {
        params: { limit: 3 },
      });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Featured 1");
    });

    it("should throw ApiError when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Network failure", 500, "Internal Server Error")
      );

      await expect(getFeaturedPosts(2)).rejects.toThrow(ApiError);
    });
  });

  describe("getTags", () => {
    it("should return tags from backend API", async () => {
      const mockTags = [
        { id: "tag-1", name: "Essential", slug: "essential" },
        { id: "tag-2", name: "Culture", slug: "culture" },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockTags);

      const result = await blogService.getTags();
      expect(apiClient.get).toHaveBeenCalledWith("/blog/tags");
      expect(result).toEqual(mockTags);
    });

    it("should throw ApiError when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Tags service offline", 500, "Internal Server Error")
      );

      await expect(getTags()).rejects.toThrow(ApiError);
    });
  });

  describe("submitGuide", () => {
    it("should call POST /blog/submissions and return success with submission id", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ submissionId: "sub-12345" });

      const payload = {
        title: "Hidden Beaches of Gazipasa",
        content: "Detailed guide to quiet secret coves near Gazipasa airport...",
        author_name: "Merve Demir",
        author_email: "merve@example.com",
        category: "Beaches",
        tags: ["Beaches", "Adventure"],
      };

      const result = await blogService.submitGuide(payload);
      expect(apiClient.post).toHaveBeenCalledWith("/blog/submissions", payload);
      expect(result.success).toBe(true);
      expect(result.id).toBe("sub-12345");
    });

    it("should throw ApiError on submission error", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(
        new ApiError("API offline", 500, "Internal Server Error")
      );

      const payload = {
        title: "Offline Guide Submission",
        content: "Offline content...",
        category: "Expats",
      };

      await expect(submitGuide(payload)).rejects.toThrow(ApiError);
    });
  });

  describe("getGuideContent", () => {
    it("should return dynamic guide content synthesized from post", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({
        id: "p-dyn",
        title: "Dynamic Local Secret",
        slug: "dynamic-local-secret",
        content: "Paragraph 1 about local secret.\nParagraph 2 about local secret.",
        cover_image_url: "https://example.com/secret.jpg",
      });

      const content = await getGuideContent("dynamic-local-secret");
      expect(content).not.toBeNull();
      expect(content?.heroImage).toBe("https://example.com/secret.jpg");
      expect(content?.sections[0].heading).toBe("Dynamic Local Secret");
    });

    it("should return null for non-existent guide", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Not found", 404, "Not Found")
      );

      const content = await getGuideContent("completely-unknown-guide-slug");
      expect(content).toBeNull();
    });
  });
});
