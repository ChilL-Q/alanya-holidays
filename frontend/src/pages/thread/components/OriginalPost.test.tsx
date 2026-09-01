import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ThreadDetail } from "@/api-services/forum.service";
import OriginalPost from "./OriginalPost";
import { deleteForumImage, uploadForumImage } from "@/api-services/storage.service";

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("@/api-services/storage.service", () => ({
  uploadForumImage: vi.fn(),
  deleteForumImage: vi.fn(),
}));

const thread: ThreadDetail = {
  id: "thread-1",
  title: "Cleopatra Beach at sunset",
  category: "Travel",
  categoryId: "travel",
  author: "Alanya Member",
  authorAvatar: "/images/avatar.svg",
  authorRole: "Discussion Starter",
  authorBio: "Community member",
  authorPosts: 1,
  authorReputation: 50,
  authorJoinDate: "2026",
  authorLocation: "Alanya, Türkiye",
  authorBadges: [],
  content: "<p>A detailed beach story.</p>",
  postedAt: "1h ago",
  views: 10,
  likes: 2,
  isLiked: false,
  isPinned: false,
  isHot: false,
  isVerified: true,
  replies: [],
};

const callbacks = {
  onLike: vi.fn(),
  onShare: vi.fn(),
  onScrollToReplies: vi.fn(),
};

describe("OriginalPost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null, profile: null });
    vi.mocked(deleteForumImage).mockResolvedValue(true);
  });

  it("renders the uploaded cover above the post content", () => {
    render(
      <OriginalPost
        {...callbacks}
        thread={{ ...thread, imageUrl: "https://cdn.example.com/forum/cover.webp" }}
      />,
    );

    const cover = screen.getByRole("img", { name: `${thread.title} cover` });
    expect(cover).toHaveAttribute("src", "https://cdn.example.com/forum/cover.webp");
    expect(cover.compareDocumentPosition(screen.getByText("A detailed beach story."))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("does not render an empty cover area when the post has no image", () => {
    render(<OriginalPost {...callbacks} thread={thread} />);

    expect(screen.queryByRole("img", { name: /cover/i })).not.toBeInTheDocument();
  });

  it("uploads a replacement cover before saving the post", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1", user_metadata: {} }, profile: null });
    vi.mocked(uploadForumImage).mockResolvedValue("https://cdn.example.com/forum/new.webp");
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <OriginalPost
        {...callbacks}
        onUpdate={onUpdate}
        thread={{ ...thread, authorId: "user-1", imageUrl: "https://cdn.example.com/old.webp" }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /edit post/i }));
    const file = new File(["new image"], "new.webp", { type: "image/webp" });
    fireEvent.change(screen.getByLabelText(/replace cover image/i), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(uploadForumImage).toHaveBeenCalledWith(file, "user-1");
      expect(onUpdate).toHaveBeenCalledWith({
        body: thread.content,
        image_url: "https://cdn.example.com/forum/new.webp",
      });
      expect(deleteForumImage).toHaveBeenCalledWith(
        "https://cdn.example.com/old.webp",
        "user-1",
      );
    });
  });

  it("rejects replacement covers larger than the 5 MB storage limit", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1", user_metadata: {} }, profile: null });
    const onUpdate = vi.fn();
    render(
      <OriginalPost
        {...callbacks}
        onUpdate={onUpdate}
        thread={{ ...thread, authorId: "user-1" }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /edit post/i }));
    const oversizedFile = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.webp", {
      type: "image/webp",
    });
    fireEvent.change(screen.getByLabelText(/replace cover image/i), {
      target: { files: [oversizedFile] },
    });

    expect(await screen.findByText(/5 MB or smaller/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
    expect(uploadForumImage).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("removes the existing cover without uploading a file", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1", user_metadata: {} }, profile: null });
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <OriginalPost
        {...callbacks}
        onUpdate={onUpdate}
        thread={{ ...thread, authorId: "user-1", imageUrl: "https://cdn.example.com/old.webp" }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /edit post/i }));
    fireEvent.click(screen.getByRole("button", { name: /remove cover/i }));
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({ body: thread.content, image_url: null });
    });
    expect(uploadForumImage).not.toHaveBeenCalled();
    expect(deleteForumImage).toHaveBeenCalledWith(
      "https://cdn.example.com/old.webp",
      "user-1",
    );
  });
});
