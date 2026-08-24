import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockUpload, mockGetPublicUrl, mockFrom } = vi.hoisted(() => {
  const mockUpload = vi.fn();
  const mockGetPublicUrl = vi.fn();
  const mockFrom = vi.fn(() => ({
    upload: mockUpload,
    getPublicUrl: mockGetPublicUrl,
  }));
  return { mockUpload, mockGetPublicUrl, mockFrom };
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    storage: {
      from: mockFrom,
    },
  },
}));

import { uploadForumImage, storageService } from "./storage.service";

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

    it("should default userId to anonymous if not provided", async () => {
      const mockFile = new File(["dummy"], "screenshot.png", { type: "image/png" });
      mockUpload.mockResolvedValue({ data: { path: "anonymous/test.png" }, error: null });
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "https://cdn.supabase.co/forum-media/anonymous/test.png" } });

      const url = await uploadForumImage(mockFile);

      expect(mockFrom).toHaveBeenCalledWith("forum-media");
      const [uploadPath] = mockUpload.mock.calls[0];
      expect(uploadPath).toMatch(/^anonymous\/[0-9a-f-]+\.png$/);
      expect(url).toBe("https://cdn.supabase.co/forum-media/anonymous/test.png");
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
    });
  });
});
