import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import BlogPage from "./page";
import { blogService, type BlogPostItem } from "@/api-services/blog.service";

vi.mock("@/api-services/blog.service", async () => {
  const actual = await vi.importActual<typeof import("@/api-services/blog.service")>(
    "@/api-services/blog.service"
  );
  return {
    ...actual,
    blogService: {
      ...actual.blogService,
      getPosts: vi.fn(),
      getTags: vi.fn(),
    },
  };
});

vi.mock("@/pages/home/components/Navbar", () => ({
  default: () => <div>Navbar</div>,
}));

vi.mock("@/pages/home/components/Footer", () => ({
  default: () => <div>Footer</div>,
}));

vi.mock("@/components/base/PageHeroImage", () => ({
  default: () => <div>Hero image</div>,
}));

vi.mock("@/components/base/PaginationControls", () => ({
  default: ({
    currentPage,
    totalPages,
    totalItems,
    onPageChange,
  }: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  }) => (
    <div>
      <span>{`Page ${currentPage} of ${totalPages}; ${totalItems} posts`}</span>
      <button type="button" onClick={() => onPageChange(2)}>
        Go to page 2
      </button>
    </div>
  ),
}));

const createPost = (id: number): BlogPostItem => ({
  id: `post-${id}`,
  title: `Blog post ${id}`,
  slug: `blog-post-${id}`,
  excerpt: `Excerpt ${id}`,
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/blog"]}>
      <BlogPage />
    </MemoryRouter>
  );

describe("BlogPage pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(blogService.getTags).mockResolvedValue([]);
    window.scrollTo = vi.fn();
    vi.mocked(blogService.getPosts).mockImplementation(async (options = {}) => {
      if (options.page === 2) {
        return {
          posts: Array.from({ length: 6 }, (_, index) => createPost(index + 7)),
          total: 13,
        };
      }
      return {
        posts: Array.from({ length: 6 }, (_, index) => createPost(index + 1)),
        total: 13,
      };
    });
  });

  it("debounces search requests", async () => {
    renderPage();

    await waitFor(() => {
      expect(blogService.getPosts).toHaveBeenCalledTimes(1);
    });
    vi.mocked(blogService.getPosts).mockClear();

    fireEvent.change(screen.getByPlaceholderText("Search blog posts..."), {
      target: { value: "beaches" },
    });

    expect(blogService.getPosts).not.toHaveBeenCalled();

    await waitFor(
      () => {
        expect(blogService.getPosts).toHaveBeenCalledTimes(1);
        expect(blogService.getPosts).toHaveBeenCalledWith({
          page: 1,
          limit: 6,
          category: undefined,
          tag: undefined,
          search: "beaches",
        });
      },
      { timeout: 700 }
    );
  });

  it("loads each page from the API and uses the server total", async () => {
    renderPage();

    await waitFor(() => {
      expect(blogService.getPosts).toHaveBeenCalledWith({
        page: 1,
        limit: 6,
        category: undefined,
        tag: undefined,
        search: undefined,
      });
    });

    expect(await screen.findByText("Blog post 1")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 3; 13 posts")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Go to page 2" }));

    await waitFor(() => {
      expect(blogService.getPosts).toHaveBeenLastCalledWith({
        page: 2,
        limit: 6,
        category: undefined,
        tag: undefined,
        search: undefined,
      });
    });

    expect(await screen.findByText("Blog post 7")).toBeInTheDocument();
    expect(screen.queryByText("Blog post 1")).not.toBeInTheDocument();
    expect(screen.getByText("Page 2 of 3; 13 posts")).toBeInTheDocument();
  });

  it("filters categories by name and tags by UUID independently", async () => {
    vi.mocked(blogService.getTags).mockResolvedValueOnce([
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Essential",
        slug: "essential",
      },
    ]);
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Beaches" }));
    await waitFor(() => {
      expect(blogService.getPosts).toHaveBeenLastCalledWith({
        page: 1,
        limit: 6,
        category: "Beaches",
        tag: undefined,
        search: undefined,
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "Essential" }));
    await waitFor(() => {
      expect(blogService.getPosts).toHaveBeenLastCalledWith({
        page: 1,
        limit: 6,
        category: "Beaches",
        tag: "11111111-1111-4111-8111-111111111111",
        search: undefined,
      });
    });
  });
});
