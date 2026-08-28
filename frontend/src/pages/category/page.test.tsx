import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CategoryPage from "./page";
import { forumService, type Category } from "@/api-services/forum.service";

const submitModalSpy = vi.fn();

vi.mock("@/api-services/forum.service", async () => {
  const actual = await vi.importActual<typeof import("@/api-services/forum.service")>(
    "@/api-services/forum.service"
  );
  return {
    ...actual,
    forumService: {
      ...actual.forumService,
      getCategoryById: vi.fn(),
      getCategories: vi.fn(),
      getThreads: vi.fn(),
    },
  };
});

vi.mock("@/pages/home/components/Navbar", () => ({
  default: () => <div>Navbar</div>,
}));

vi.mock("@/pages/home/components/Footer", () => ({
  default: () => <div>Footer</div>,
}));

vi.mock("./components/CategoryHeader", () => ({
  default: ({ category }: { category: { name: string } }) => (
    <div>Header: {category.name}</div>
  ),
}));

vi.mock("./components/SubcategorySidebar", () => ({
  default: ({ subcategories, onSelect }: { subcategories: string[]; onSelect: (sub: string | null) => void }) => (
    <div>
      <button onClick={() => onSelect(null)}>All Topics</button>
      {subcategories.map((sub) => (
        <button key={sub} onClick={() => onSelect(sub)}>
          {sub}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("./components/ThreadCard", () => ({
  default: () => <div>Thread card</div>,
}));

vi.mock("./components/ThreadFilters", () => ({
  default: () => <div>Thread filters</div>,
}));

vi.mock("@/components/base/PaginationControls", () => ({
  default: () => <div>Pagination</div>,
}));

vi.mock("@/components/base/ErrorState", () => ({
  default: ({ title, message }: { title: string; message: string }) => (
    <div>
      {title}: {message}
    </div>
  ),
}));

vi.mock("@/components/feature/SubmitContentModal", () => ({
  default: (props: {
    isOpen: boolean;
    onClose: () => void;
    initialCategoryId?: string;
    initialCategoryName?: string;
    initialSubcategory?: string;
    fallbackPath?: string;
    lockCategory?: boolean;
  }) => {
    submitModalSpy(props);
    return props.isOpen ? (
      <div role="dialog" aria-label="Share a Post">
        <div>category:{props.initialCategoryId}</div>
        <div>name:{props.initialCategoryName}</div>
        <div>topic:{props.initialSubcategory ?? ""}</div>
        <div>fallback:{props.fallbackPath}</div>
        <div>locked:{String(props.lockCategory)}</div>
        <button onClick={props.onClose}>Close</button>
      </div>
    ) : null;
  },
}));

const generalCategory: Category = {
  id: "cat-general",
  name: "General",
  slug: "general",
  icon: "ri-discuss-line",
  description: "Anything about life in Alanya",
  threadCount: 12,
  memberCount: 18,
  subcategories: ["Tips & Tricks", "Moving Advice"],
  color: "from-primary-500 to-primary-700",
  image: "/images/placeholder-business.svg",
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/category/general"]}>
      <Routes>
        <Route path="/category/:categoryId" element={<CategoryPage />} />
      </Routes>
    </MemoryRouter>
  );

describe("CategoryPage modal integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(forumService.getCategoryById).mockResolvedValue(generalCategory);
    vi.mocked(forumService.getCategories).mockResolvedValue([
      generalCategory,
      {
        ...generalCategory,
        id: "cat-living",
        name: "Living",
        slug: "living",
        subcategories: [],
      },
    ]);
    vi.mocked(forumService.getThreads).mockResolvedValue({
      threads: [],
      total: 0,
    });
  });

  it("passes parent category and active topic into SubmitContentModal", async () => {
    renderPage();

    await waitFor(() => {
      expect(forumService.getCategoryById).toHaveBeenCalledWith("general");
    });

    fireEvent.click(screen.getByRole("button", { name: "Tips & Tricks" }));
    fireEvent.click(screen.getByRole("button", { name: /start a discussion/i }));

    expect(
      screen.getByRole("dialog", { name: /share a post/i })
    ).toBeInTheDocument();
    expect(screen.getByText("category:cat-general")).toBeInTheDocument();
    expect(screen.getByText("name:General")).toBeInTheDocument();
    expect(screen.getByText("topic:Tips & Tricks")).toBeInTheDocument();
    expect(screen.getByText("fallback:/category/general")).toBeInTheDocument();
    expect(screen.getByText("locked:true")).toBeInTheDocument();
  });
});
