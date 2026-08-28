import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import BlogComments from "./BlogComments";
import { blogService, type BlogComment } from "@/api-services/blog.service";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

vi.mock("@/api-services/blog.service", async () => {
  const actual = await vi.importActual<typeof import("@/api-services/blog.service")>(
    "@/api-services/blog.service"
  );
  return {
    ...actual,
    blogService: {
      ...actual.blogService,
      getComments: vi.fn(),
      createComment: vi.fn(),
      toggleCommentLike: vi.fn(),
    },
  };
});

const rootComment: BlogComment = {
  id: "root-comment",
  post_id: "post-1",
  user_id: "user-1",
  body: "Root comment",
  parent_id: null,
  like_count: 0,
  is_removed: false,
  created_at: "2026-08-28T08:00:00.000Z",
  updated_at: "2026-08-28T08:00:00.000Z",
  author: { full_name: "Root author", avatar_url: null },
};

const childComment: BlogComment = {
  ...rootComment,
  id: "child-comment",
  user_id: "user-2",
  body: "Child comment",
  parent_id: rootComment.id,
  author: { full_name: "Child author", avatar_url: null },
};

describe("BlogComments nested replies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(blogService.getComments).mockResolvedValue([
      rootComment,
      childComment,
    ]);
    vi.mocked(blogService.createComment).mockResolvedValue({
      ...childComment,
      id: "nested-reply",
      body: "Reply to child",
      parent_id: childComment.id,
    });
  });

  it("prevents concurrent like requests and never shows a negative count", async () => {
    let resolveLike: ((value: { liked: boolean }) => void) | undefined;
    vi.mocked(blogService.getComments).mockResolvedValueOnce([
      {
        ...rootComment,
        isLiked: true,
        like_count: 0,
      },
    ]);
    vi.mocked(blogService.toggleCommentLike).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveLike = resolve;
      })
    );

    render(
      <MemoryRouter>
        <BlogComments postId="post-1" />
      </MemoryRouter>
    );

    const likeButton = await screen.findByRole("button", { name: "Unlike comment" });
    fireEvent.click(likeButton);
    fireEvent.click(likeButton);

    expect(blogService.toggleCommentLike).toHaveBeenCalledTimes(1);
    resolveLike?.({ liked: false });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Like comment" })).toBeInTheDocument();
    });
    expect(screen.queryByText("-1")).not.toBeInTheDocument();
  });

  it("opens and submits the reply form for a nested comment", async () => {
    render(
      <MemoryRouter>
        <BlogComments postId="post-1" />
      </MemoryRouter>
    );

    expect(await screen.findByText("Child comment")).toBeInTheDocument();

    const replyButtons = screen.getAllByRole("button", { name: "Reply" });
    fireEvent.click(replyButtons[1]);

    const replyInput = screen.getByPlaceholderText("Write a reply...");
    fireEvent.change(replyInput, { target: { value: "Reply to child" } });
    const replyForm = replyInput.closest("form");
    expect(replyForm).not.toBeNull();
    fireEvent.click(replyForm!.querySelector('button[type="submit"]')!);

    await waitFor(() => {
      expect(blogService.createComment).toHaveBeenCalledWith(
        "post-1",
        "Reply to child",
        "child-comment"
      );
    });
  });
});
