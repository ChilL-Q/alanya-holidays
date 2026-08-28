import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import BlogSubmitPage from "./page";
import { blogService } from "@/api-services/blog.service";
import { deleteBlogImage, uploadBlogImage } from "@/api-services/storage.service";
import { ApiError } from "@/lib/api-client";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    user: { id: "user-1" },
  }),
}));

vi.mock("@/api-services/blog.service", async () => {
  const actual = await vi.importActual<typeof import("@/api-services/blog.service")>(
    "@/api-services/blog.service"
  );
  return {
    ...actual,
    blogService: {
      ...actual.blogService,
      getTags: vi.fn(),
      submitGuide: vi.fn(),
    },
  };
});

vi.mock("@/api-services/storage.service", () => ({
  uploadBlogImage: vi.fn(),
  deleteBlogImage: vi.fn(),
}));

vi.mock("@/pages/home/components/Navbar", () => ({
  default: () => <div>Navbar</div>,
}));

vi.mock("@/pages/home/components/Footer", () => ({
  default: () => <div>Footer</div>,
}));

describe("BlogSubmitPage taxonomy", () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <BlogSubmitPage />
      </MemoryRouter>
    );

  const fillRequiredFields = () => {
    fireEvent.change(screen.getByPlaceholderText("e.g., Hidden Gems in Alanya Old Town"), {
      target: { value: "A local guide" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(
        "Write your blog post content here. Share your experiences, tips, and recommendations..."
      ),
      { target: { value: "Useful recommendations for visitors." } }
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(blogService.getTags).mockResolvedValue([
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Essential",
        slug: "essential",
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        name: "Family",
        slug: "family",
      },
    ]);
    vi.mocked(blogService.submitGuide).mockResolvedValue({
      success: true,
      id: "submission-1",
    });
    vi.mocked(uploadBlogImage).mockResolvedValue(
      "https://project.supabase.co/storage/v1/object/public/blog-media/user-1/cover.webp"
    );
    vi.mocked(deleteBlogImage).mockResolvedValue(true);
    URL.createObjectURL = vi.fn(() => "blob:cover-preview");
    URL.revokeObjectURL = vi.fn();
  });

  it("formats selected text with the Markdown toolbar and previews it", () => {
    renderPage();
    const contentInput = screen.getByPlaceholderText(
      "Write your blog post content here. Share your experiences, tips, and recommendations..."
    ) as HTMLTextAreaElement;
    fireEvent.change(contentInput, {
      target: { value: "Best beaches in Alanya" },
    });
    contentInput.setSelectionRange(5, 12);

    fireEvent.click(screen.getByRole("button", { name: "Bold" }));

    expect(contentInput).toHaveValue("Best **beaches** in Alanya");
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(screen.getByText("beaches").tagName).toBe("STRONG");
  });

  it("previews article content and preserves it when returning to write mode", async () => {
    renderPage();
    const contentInput = screen.getByPlaceholderText(
      "Write your blog post content here. Share your experiences, tips, and recommendations..."
    );
    fireEvent.change(contentInput, {
      target: { value: "## Best beaches\n\nBring water and sunscreen." },
    });

    fireEvent.click(screen.getByRole("button", { name: "Preview" }));

    expect(screen.getByRole("heading", { name: "Best beaches" })).toBeInTheDocument();
    expect(screen.getByText("Bring water and sunscreen.")).toBeInTheDocument();
    expect(contentInput).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Write" }));

    expect(
      screen.getByPlaceholderText(
        "Write your blog post content here. Share your experiences, tips, and recommendations..."
      )
    ).toHaveValue("## Best beaches\n\nBring water and sunscreen.");
  });

  it("shows inline validation errors without calling the API", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Submit Post" }));

    expect(await screen.findByText("Please enter a post title.")).toBeInTheDocument();
    expect(screen.getByText("Content must be at least 10 characters.")).toBeInTheDocument();
    expect(blogService.submitGuide).not.toHaveBeenCalled();
  });

  it.each([
    [400, "Some fields are invalid. Please review your post and try again."],
    [401, "Your session has expired. Please sign in again."],
    [429, "You have submitted too many posts. Please try again later."],
    [503, "The server is currently unavailable. Please try again later."],
  ])("shows a specific message for API status %i", async (status, message) => {
    vi.mocked(blogService.submitGuide).mockRejectedValueOnce(
      new ApiError("Request failed", status, "Request failed")
    );
    renderPage();
    await screen.findByRole("combobox");
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: "Submit Post" }));

    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it("shows a cover upload error separately from submission errors", async () => {
    vi.mocked(uploadBlogImage).mockRejectedValueOnce(new Error("Storage unavailable"));
    renderPage();
    await screen.findByRole("combobox");
    const cover = new File(["cover"], "cover.webp", { type: "image/webp" });
    fireEvent.change(screen.getByLabelText("Cover image"), {
      target: { files: [cover] },
    });
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: "Submit Post" }));

    expect(
      await screen.findByText("Cover image upload failed. Please try again or remove the image.")
    ).toBeInTheDocument();
    expect(blogService.submitGuide).not.toHaveBeenCalled();
  });

  it("submits an independent category and selected tag UUIDs", async () => {
    render(
      <MemoryRouter>
        <BlogSubmitPage />
      </MemoryRouter>
    );

    await screen.findByRole("checkbox", { name: "Essential" });
    expect(screen.getByRole("combobox", { name: "Category" })).toHaveValue("Guides");
    fireEvent.change(screen.getByRole("combobox", { name: "Category" }), {
      target: { value: "Beaches" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "Essential" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Family" }));

    fireEvent.change(screen.getByPlaceholderText("e.g., Hidden Gems in Alanya Old Town"), {
      target: { value: "A local guide" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(
        "Write your blog post content here. Share your experiences, tips, and recommendations..."
      ),
      { target: { value: "Useful recommendations for visitors." } }
    );
    fireEvent.click(screen.getByRole("button", { name: "Submit Post" }));

    await waitFor(() => {
      expect(blogService.submitGuide).toHaveBeenCalledWith({
        title: "A local guide",
        category: "Beaches",
        content: "Useful recommendations for visitors.",
        tags: [
          "11111111-1111-4111-8111-111111111111",
          "22222222-2222-4222-8222-222222222222",
        ],
        video_url: undefined,
        media_urls: undefined,
      });
    });
  });

  it("uploads a selected cover and submits its public URL", async () => {
    render(
      <MemoryRouter>
        <BlogSubmitPage />
      </MemoryRouter>
    );

    await screen.findByRole("combobox");
    const cover = new File(["cover"], "cover.webp", { type: "image/webp" });
    fireEvent.change(screen.getByLabelText("Cover image"), {
      target: { files: [cover] },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g., Hidden Gems in Alanya Old Town"), {
      target: { value: "A visual guide" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(
        "Write your blog post content here. Share your experiences, tips, and recommendations..."
      ),
      { target: { value: "A guide with a locally uploaded cover." } }
    );
    fireEvent.click(screen.getByRole("button", { name: "Submit Post" }));

    await waitFor(() => {
      expect(uploadBlogImage).toHaveBeenCalledWith(cover, "user-1");
      expect(blogService.submitGuide).toHaveBeenCalledWith(
        expect.objectContaining({
          media_urls: [
            "https://project.supabase.co/storage/v1/object/public/blog-media/user-1/cover.webp",
          ],
        })
      );
    });
  });

  it("deletes an uploaded cover when submission creation fails", async () => {
    vi.mocked(blogService.submitGuide).mockRejectedValueOnce(new Error("Submission failed"));
    render(
      <MemoryRouter>
        <BlogSubmitPage />
      </MemoryRouter>
    );

    await screen.findByRole("combobox");
    const cover = new File(["cover"], "cover.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Cover image"), {
      target: { files: [cover] },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g., Hidden Gems in Alanya Old Town"), {
      target: { value: "Failed guide" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(
        "Write your blog post content here. Share your experiences, tips, and recommendations..."
      ),
      { target: { value: "This submission will fail after upload." } }
    );
    fireEvent.click(screen.getByRole("button", { name: "Submit Post" }));

    await waitFor(() => {
      expect(deleteBlogImage).toHaveBeenCalledWith(
        "https://project.supabase.co/storage/v1/object/public/blog-media/user-1/cover.webp",
        "user-1"
      );
    });
    expect(screen.getByText("Failed to submit post. Please try again later.")).toBeInTheDocument();
  });
});
