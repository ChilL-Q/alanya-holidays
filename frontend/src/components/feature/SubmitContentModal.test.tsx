import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SubmitContentModal from "./SubmitContentModal";
import { useAuth } from "@/context/AuthContext";
import { forumService, type Category } from "@/api-services/forum.service";
import toast from "react-hot-toast";

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/components/base/RichTextEditor", () => ({
  default: ({ value, onChange, inputId, ariaLabel }: { value: string; onChange: (value: string) => void; inputId?: string; ariaLabel?: string }) => (
    <textarea
      id={inputId}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock("@/api-services/forum.service", async () => {
  const actual = await vi.importActual<typeof import("@/api-services/forum.service")>(
    "@/api-services/forum.service"
  );
  return {
    ...actual,
    forumService: {
      ...actual.forumService,
      getCategories: vi.fn(),
      createThread: vi.fn(),
    },
  };
});

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const CATEGORIES: Category[] = [
  {
    id: "cat-general",
    name: "General",
    slug: "general",
    icon: "ri-discuss-line",
    description: "Anything about life in Alanya",
    threadCount: 12,
    memberCount: 18,
    subcategories: ["Tips & Tricks"],
    color: "from-primary-500 to-primary-700",
    image: "/images/placeholder-business.svg",
  },
  {
    id: "cat-living",
    name: "Living",
    slug: "living",
    icon: "ri-home-line",
    description: "Day-to-day living tips",
    threadCount: 4,
    memberCount: 10,
    subcategories: [],
    color: "from-primary-500 to-primary-700",
    image: "/images/placeholder-business.svg",
  },
];

const renderModal = (
  props: Partial<React.ComponentProps<typeof SubmitContentModal>> = {}
) => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmitSuccess: vi.fn(),
  };

  return render(
    <MemoryRouter>
      <SubmitContentModal {...defaultProps} {...props} />
    </MemoryRouter>
  );
};

const makeCreatedPost = (slug: string) => ({
  id: "post-1",
  title: "Created post",
  category: "General",
  categoryId: "general",
  author: "Member",
  authorAvatar: "/images/placeholder-business.svg",
  replies: 0,
  views: 0,
  likes: 0,
  postedAt: "Just now",
  isHot: false,
  excerpt: "Created body",
  slug,
});

describe("SubmitContentModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      loading: false,
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(forumService.getCategories).mockResolvedValue(CATEGORIES);
    vi.mocked(forumService.createThread).mockResolvedValue(
      makeCreatedPost("default-thread")
    );
  });

  it("renders the modal shell and accessible form controls", async () => {
    renderModal();

    expect(
      screen.getByRole("dialog", { name: /share a post/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Story/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Media URL/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(forumService.getCategories).toHaveBeenCalledTimes(1);
    });
  });

  it("loads backend categories and reveals topics for the selected category", async () => {
    renderModal();

    const categorySelect = screen.getByLabelText(/^Category/i);
    await waitFor(() => expect(categorySelect).not.toBeDisabled());

    fireEvent.change(categorySelect, {
      target: { value: "cat-general" },
    });

    expect(screen.getByLabelText(/Topic/i)).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Tips & Tricks" })
    ).toBeInTheDocument();
  });

  it("blocks submission when the user is not authenticated", async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      loading: false,
    } as unknown as ReturnType<typeof useAuth>);

    renderModal();

    await waitFor(() => expect(forumService.getCategories).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /publish post/i }));

    expect(
      await screen.findByText(/Please sign in to share a post with the community/i)
    ).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith(
      "Please sign in to share a post with the community."
    );
  });

  it("validates the required category and title fields", async () => {
    renderModal();

    await waitFor(() => expect(forumService.getCategories).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /publish post/i }));
    expect(
      await screen.findByText(/Please pick a category for your post/i)
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^Category/i), {
      target: { value: "cat-general" },
    });
    fireEvent.click(screen.getByRole("button", { name: /publish post/i }));
    expect(
      await screen.findByText(/Please enter a title for your post/i)
    ).toBeInTheDocument();
  });

  it("publishes using category_id plus optional subcategory when a topic is selected", async () => {
    const onClose = vi.fn();
    const onSubmitSuccess = vi.fn();

    vi.mocked(forumService.createThread).mockResolvedValue(
      makeCreatedPost("sunset-cove-guide")
    );

    renderModal({ onClose, onSubmitSuccess });

    await waitFor(() => expect(screen.getByLabelText(/^Category/i)).not.toBeDisabled());

    fireEvent.change(screen.getByLabelText(/^Category/i), {
      target: { value: "cat-general" },
    });
    fireEvent.change(screen.getByLabelText(/Topic/i), {
      target: { value: "Tips & Tricks" },
    });
    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "Sunset cove guide" },
    });
    fireEvent.change(screen.getByLabelText(/Story/i), {
      target: { value: "Quiet rocky cove with golden hour reflections." },
    });

    fireEvent.click(screen.getByRole("button", { name: /publish post/i }));

    await waitFor(() => {
      expect(forumService.createThread).toHaveBeenCalledWith({
        title: "Sunset cove guide",
        body: "Quiet rocky cove with golden hour reflections.",
        category_id: "cat-general",
        subcategory: "Tips & Tricks",
      });
    });

    expect(onSubmitSuccess).toHaveBeenCalledWith({
      categoryId: "cat-general",
      subcategoryId: "Tips & Tricks",
      title: "Sunset cove guide",
      body: "Quiet rocky cove with golden hour reflections.",
      mediaUrl: undefined,
    });
    expect(onClose).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/thread/sunset-cove-guide");
  });

  it("preselects and preserves a matching topic when category is locked from the category page", async () => {
    renderModal({
      initialCategoryId: "cat-general",
      initialCategoryName: "General",
      initialSubcategory: "Tips & Tricks",
      lockCategory: true,
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/^Category/i)).toHaveValue("cat-general");
    });

    expect(screen.getByLabelText(/^Category/i)).toBeDisabled();
    expect(screen.getByLabelText(/Topic/i)).toHaveValue("Tips & Tricks");
  });

  it("clears a stale initial topic when it does not belong to the selected category", async () => {
    renderModal({
      initialCategoryId: "cat-living",
      initialCategoryName: "Living",
      initialSubcategory: "Tips & Tricks",
      lockCategory: true,
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/^Category/i)).toHaveValue("cat-living");
    });

    expect(screen.queryByLabelText(/Topic/i)).not.toBeInTheDocument();
  });
});
