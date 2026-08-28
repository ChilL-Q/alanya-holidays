import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import BlogPostPage from "./page";
import { blogService } from "@/api-services/blog.service";
import { ApiError } from "@/lib/api-client";

vi.mock("@/api-services/blog.service", async () => {
  const actual = await vi.importActual<typeof import("@/api-services/blog.service")>(
    "@/api-services/blog.service"
  );
  return {
    ...actual,
    blogService: {
      ...actual.blogService,
      getPostBySlug: vi.fn(),
    },
  };
});

vi.mock("@/pages/home/components/Navbar", () => ({
  default: () => <div>Navbar</div>,
}));

vi.mock("@/pages/home/components/Footer", () => ({
  default: () => <div>Footer</div>,
}));

vi.mock("@/components/article/ArticleContentRenderer", () => ({
  default: () => <div>Article content</div>,
}));

vi.mock("./components/BlogComments", () => ({
  default: () => <div>Comments</div>,
}));

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/blog/test-post"]}>
      <Routes>
        <Route path="/blog/:slug" element={<BlogPostPage />} />
      </Routes>
    </MemoryRouter>
  );

describe("BlogPostPage load states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows not found only when the post does not exist", async () => {
    vi.mocked(blogService.getPostBySlug).mockResolvedValueOnce(null);

    renderPage();

    expect(await screen.findByRole("heading", { name: "Post Not Found" })).toBeInTheDocument();
  });

  it("shows a retryable load error for server failures", async () => {
    vi.mocked(blogService.getPostBySlug)
      .mockRejectedValueOnce(new ApiError("Server unavailable", 500, "Internal Server Error"))
      .mockResolvedValueOnce(null);

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Unable to Load Post" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Post Not Found" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));

    await waitFor(() => {
      expect(blogService.getPostBySlug).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByRole("heading", { name: "Post Not Found" })).toBeInTheDocument();
  });
});
