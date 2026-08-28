import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockUpload, mockRemove, mockGetPublicUrl, mockFrom } = vi.hoisted(() => {
  const mockUpload = vi.fn();
  const mockRemove = vi.fn();
  const mockGetPublicUrl = vi.fn();
  const mockFrom = vi.fn(() => ({
    upload: mockUpload,
    remove: mockRemove,
    getPublicUrl: mockGetPublicUrl,
  }));
  return { mockUpload, mockRemove, mockGetPublicUrl, mockFrom };
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    storage: {
      from: mockFrom,
    },
  },
}));

import {
  deleteBlogImage,
  deleteForumImage,
  uploadBlogImage,
  uploadForumImage,
  storageService,
} from "./storage.service";

describe("storage.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("uploadForumImage", () => {
    it("should successfully upload a file to the forum-media bucket and return the public URL", async () => {
      const mockFile = new File(["dummy content"], "photo.jpg", { type: "image/jpeg" });
      const userId = "user-123-abc";
      const expectedUrl = "https://cdn.supabase.co/storage/v1/object/public/forum-media/user-123-abc/uuid.jpg";

      mockUpload.mockResolvedValue({
        data: { path: "user-123-abc/test-uuid.jpg" },
        error: null,
      });
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: expectedUrl },
      });

      const url = await uploadForumImage(mockFile, userId);

      expect(mockFrom).toHaveBeenCalledWith("forum-media");
      expect(mockUpload).toHaveBeenCalledTimes(1);
      const [uploadPath, fileArg, options] = mockUpload.mock.calls[0];
      expect(uploadPath).toMatch(new RegExp(`^${userId}/[0-9a-f-]+\\.jpg$`));
      expect(fileArg).toBe(mockFile);
      expect(options).toEqual({ cacheControl: "3600", upsert: false });
      expect(mockGetPublicUrl).toHaveBeenCalledWith(uploadPath);
      expect(url).toBe(expectedUrl);
    });

    it("rejects uploads without an authenticated owner ID", async () => {
      const mockFile = new File(["dummy"], "screenshot.png", { type: "image/png" });

      await expect(uploadForumImage(mockFile, " ")).rejects.toThrow(
        "A user ID is required to upload a forum image",
      );

      expect(mockUpload).not.toHaveBeenCalled();
    });

    it("should sanitize file extensions to lowercase alphanumeric", async () => {
      const mockFile = new File(["dummy"], "MY_IMAGE.PNG", { type: "image/png" });
      mockUpload.mockResolvedValue({ data: { path: "user-1/test.png" }, error: null });
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "https://cdn.supabase.co/forum-media/user-1/test.png" } });

      await uploadForumImage(mockFile, "user-1");

      const [uploadPath] = mockUpload.mock.calls[0];
      expect(uploadPath).toMatch(/^user-1\/[0-9a-f-]+\.png$/);
    });

    it("should fallback to png extension if file has no extension", async () => {
      const mockFile = new File(["dummy"], "blob", { type: "image/png" });
      mockUpload.mockResolvedValue({ data: { path: "user-1/test.png" }, error: null });
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "https://cdn.supabase.co/forum-media/user-1/test.png" } });

      await uploadForumImage(mockFile, "user-1");

      const [uploadPath] = mockUpload.mock.calls[0];
      expect(uploadPath).toMatch(/^user-1\/[0-9a-f-]+\.png$/);
    });

    it("should throw error if upload fails", async () => {
      const mockFile = new File(["dummy"], "error.png", { type: "image/png" });
      const uploadError = new Error("Bucket quota exceeded");
      mockUpload.mockResolvedValue({ data: null, error: uploadError });

      await expect(uploadForumImage(mockFile, "user-1")).rejects.toThrow("Bucket quota exceeded");
    });

    it("should export storageService object with uploadForumImage", () => {
      expect(storageService).toBeDefined();
      expect(typeof storageService.uploadForumImage).toBe("function");
      expect(typeof storageService.uploadBlogImage).toBe("function");
      expect(typeof storageService.deleteBlogImage).toBe("function");
    });
  });

  describe("blog images", () => {
    it("uploads an owned image to the blog-media bucket", async () => {
      const file = new File(["cover"], "alanya.webp", { type: "image/webp" });
      const expectedUrl =
        "https://project.supabase.co/storage/v1/object/public/blog-media/user-1/cover.webp";
      mockUpload.mockResolvedValue({ data: { path: "user-1/cover.webp" }, error: null });
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: expectedUrl } });

      const url = await uploadBlogImage(file, "user-1");

      expect(mockFrom).toHaveBeenCalledWith("blog-media");
      const [path, uploadedFile, options] = mockUpload.mock.calls[0];
      expect(path).toMatch(/^user-1\/[0-9a-f-]+\.webp$/);
      expect(uploadedFile).toBe(file);
      expect(options).toEqual({ cacheControl: "3600", upsert: false });
      expect(url).toBe(expectedUrl);
    });

    it("deletes an owned image from the blog-media bucket", async () => {
      mockRemove.mockResolvedValue({ data: [], error: null });

      const deleted = await deleteBlogImage(
        "https://project.supabase.co/storage/v1/object/public/blog-media/user-1/cover.webp",
        "user-1"
      );

      expect(mockFrom).toHaveBeenCalledWith("blog-media");
      expect(mockRemove).toHaveBeenCalledWith(["user-1/cover.webp"]);
      expect(deleted).toBe(true);
    });

    it("refuses to delete another user's blog image", async () => {
      const deleted = await deleteBlogImage(
        "https://project.supabase.co/storage/v1/object/public/blog-media/user-2/cover.webp",
        "user-1"
      );

      expect(deleted).toBe(false);
      expect(mockRemove).not.toHaveBeenCalled();
    });
  });

  describe("deleteForumImage", () => {
    it("deletes an owned object from the forum-media bucket", async () => {
      mockRemove.mockResolvedValue({ data: [], error: null });

      const deleted = await deleteForumImage(
        "https://project.supabase.co/storage/v1/object/public/forum-media/user-1/cover.webp",
        "user-1",
      );

      expect(mockFrom).toHaveBeenCalledWith("forum-media");
      expect(mockRemove).toHaveBeenCalledWith(["user-1/cover.webp"]);
      expect(deleted).toBe(true);
    });

    it("refuses to delete another user's object", async () => {
      const deleted = await deleteForumImage(
        "https://project.supabase.co/storage/v1/object/public/forum-media/user-2/cover.webp",
        "user-1",
      );

      expect(deleted).toBe(false);
      expect(mockRemove).not.toHaveBeenCalled();
    });

    it("throws when Supabase fails to delete an owned object", async () => {
      mockRemove.mockResolvedValue({ data: null, error: new Error("Delete failed") });

      await expect(
        deleteForumImage(
          "https://project.supabase.co/storage/v1/object/public/forum-media/user-1/cover.webp",
          "user-1",
        ),
      ).rejects.toThrow("Delete failed");
    });
  });
});
