import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import CategoryPage from "./page";
import { forumService, type Category } from "@/api-services/forum.service";

const submitModalSpy = vi.fn();
const authState = vi.hoisted(() => ({
  user: null as { id: string } | null,
  isAuthenticated: false,
  loading: false,
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => authState,
}));

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

function RegistrationDestination() {
  const location = useLocation();
  const returnPath = (
    location.state as { from?: { pathname?: string } } | null
  )?.from?.pathname;

  return <div>Register destination: {returnPath}</div>;
}

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/category/general"]}>
      <Routes>
        <Route path="/category/:categoryId" element={<CategoryPage />} />
        <Route path="/register" element={<RegistrationDestination />} />
      </Routes>
    </MemoryRouter>
  );

describe("CategoryPage modal integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = null;
    authState.isAuthenticated = false;
    authState.loading = false;
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
    authState.user = { id: "user-1" };
    authState.isAuthenticated = true;
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

  it("sends guests to registration while preserving the selected category and topic", async () => {
    renderPage();

    await waitFor(() => {
      expect(forumService.getCategoryById).toHaveBeenCalledWith("general");
    });

    fireEvent.click(screen.getByRole("button", { name: "Tips & Tricks" }));
    fireEvent.click(screen.getByRole("button", { name: /start a discussion/i }));

    expect(
      screen.getByText(
        "Register destination: /new-thread?category=general&subcategory=Tips+%26+Tricks"
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: /share a post/i })).not.toBeInTheDocument();
  });
});
