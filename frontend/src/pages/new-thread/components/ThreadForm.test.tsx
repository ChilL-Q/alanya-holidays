import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ThreadForm from "./ThreadForm";
import { forumService } from "@/api-services/forum.service";
import { deleteForumImage, uploadForumImage } from "@/api-services/storage.service";

vi.mock("@/api-services/storage.service", () => ({
  uploadForumImage: vi.fn(),
  deleteForumImage: vi.fn(),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

const mockCategories = [
  {
    id: "cat-1",
    name: "General Discussion",
    slug: "general",
    icon: "ri-chat-1-line",
    color: "bg-blue-500",
    description: "General discussions about Alanya",
    threadCount: 10,
    memberCount: 5,
    image: "",
    subcategories: ["Alanya Tips"],
  },
  {
    id: "cat-2",
    name: "Living in Alanya",
    slug: "living",
    icon: "ri-home-line",
    color: "bg-green-500",
    description: "Living tips",
    threadCount: 6,
    memberCount: 4,
    image: "",
    subcategories: [],
  },
];

describe("ThreadForm Success Navigation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.mocked(uploadForumImage).mockResolvedValue("https://cdn.example.com/default.webp");
    vi.mocked(deleteForumImage).mockResolvedValue(true);
    vi.spyOn(forumService, "getCategories").mockResolvedValue(mockCategories);
  });

  it("renders Topic terminology and SPA Link components for success actions", async () => {
    vi.spyOn(forumService, "createThread").mockResolvedValue({
      id: "thread-123",
      slug: "awesome-thread",
      title: "My Awesome Thread",
      category_id: "cat-1",
      author_id: "user-1",
      created_at: new Date().toISOString(),
      views: 0,
      likes_count: 0,
      replies_count: 0,
    } as any);

    const { container } = render(
      <MemoryRouter>
        <ThreadForm />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("General Discussion")).toBeInTheDocument();
    });

    expect(screen.getByText(/Topic/i)).toBeInTheDocument();

    const categorySelect = container.querySelector('select[name="category"]')!;
    fireEvent.change(categorySelect, { target: { value: "cat-1" } });

    const topicSelect = container.querySelector('select[name="subcategory"]')!;
    fireEvent.change(topicSelect, { target: { value: "Alanya Tips" } });

    const titleInput = screen.getByPlaceholderText(/hidden cleopatra beach sunset cove/i);
    fireEvent.change(titleInput, { target: { value: "My Awesome Thread Title" } });

    const contentInput = screen.getByLabelText(/story/i);
    fireEvent.change(contentInput, {
      target: { value: "This is a detailed post content with more than twenty characters long." },
    });

    const submitBtn = screen.getByRole("button", { name: /publish post/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Discussion Created!")).toBeInTheDocument();
    });

    expect(screen.getByText(/→ Topic:/i)).toBeInTheDocument();
    expect(screen.getByText("Alanya Tips")).toBeInTheDocument();

    const threadLink = screen.getByRole("link", { name: /view your thread/i });
    expect(threadLink).toHaveAttribute("href", "/thread/awesome-thread");

    const categoryLink = screen.getByRole("link", { name: /view in general discussion/i });
    expect(categoryLink).toHaveAttribute("href", "/category/general");
  });

  it("uploads a selected cover image and includes its URL when publishing", async () => {
    const imageUrl = "https://cdn.example.com/forum/sunset.webp";
    vi.mocked(uploadForumImage).mockResolvedValueOnce(imageUrl);
    vi.spyOn(forumService, "createThread").mockResolvedValue({
      id: "thread-cover",
      slug: "thread-with-cover",
      title: "Thread with cover",
      imageUrl,
    } as any);

    const { container } = render(
      <MemoryRouter>
        <ThreadForm />
      </MemoryRouter>,
    );

    await screen.findByText("General Discussion");
    fireEvent.change(container.querySelector('select[name="category"]')!, {
      target: { value: "cat-1" },
    });
    fireEvent.change(screen.getByPlaceholderText(/hidden cleopatra beach sunset cove/i), {
      target: { value: "Thread with cover" },
    });
    fireEvent.change(screen.getByLabelText(/story/i), {
      target: { value: "A detailed story with a beautiful cover image." },
    });

    const file = new File(["image"], "sunset.webp", { type: "image/webp" });
    fireEvent.change(screen.getByLabelText(/cover image/i), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: /publish post/i }));

    await waitFor(() => {
      expect(uploadForumImage).toHaveBeenCalledWith(file, "user-1");
      expect(forumService.createThread).toHaveBeenCalledWith({
        title: "Thread with cover",
        body: "A detailed story with a beautiful cover image.",
        category_id: "cat-1",
        subcategory: undefined,
        image_url: imageUrl,
      });
    });
  });

  it("rejects unsupported cover image files before upload", async () => {
    render(
      <MemoryRouter>
        <ThreadForm />
      </MemoryRouter>,
    );

    await screen.findByText("General Discussion");
    const file = new File(["not an image"], "notes.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText(/cover image/i), {
      target: { files: [file] },
    });

    expect(await screen.findByText(/jpg, png, or webp/i)).toBeInTheDocument();
    expect(uploadForumImage).not.toHaveBeenCalled();
  });

  it("rejects cover images larger than the 5 MB storage limit", async () => {
    render(
      <MemoryRouter>
        <ThreadForm />
      </MemoryRouter>,
    );

    await screen.findByText("General Discussion");
    const oversizedFile = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.webp", {
      type: "image/webp",
    });
    fireEvent.change(screen.getByLabelText(/cover image/i), {
      target: { files: [oversizedFile] },
    });

    expect(await screen.findByText(/5 MB or smaller/i)).toBeInTheDocument();
    expect(uploadForumImage).not.toHaveBeenCalled();
  });

  it("does not publish the thread when cover upload fails", async () => {
    vi.mocked(uploadForumImage).mockRejectedValueOnce(new Error("Upload failed"));
    const createThread = vi.spyOn(forumService, "createThread");
    const { container } = render(
      <MemoryRouter>
        <ThreadForm />
      </MemoryRouter>,
    );

    await screen.findByText("General Discussion");
    fireEvent.change(container.querySelector('select[name="category"]')!, {
      target: { value: "cat-1" },
    });
    fireEvent.change(screen.getByPlaceholderText(/hidden cleopatra beach sunset cove/i), {
      target: { value: "Thread with failed cover" },
    });
    fireEvent.change(screen.getByLabelText(/story/i), {
      target: { value: "A detailed story whose cover upload will fail." },
    });
    fireEvent.change(screen.getByLabelText(/cover image/i), {
      target: { files: [new File(["image"], "cover.png", { type: "image/png" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: /publish post/i }));

    expect(await screen.findByText("Upload failed")).toBeInTheDocument();
    expect(createThread).not.toHaveBeenCalled();
  });

  it("cleans up an uploaded cover when thread creation fails", async () => {
    const uploadedUrl = "https://project.supabase.co/storage/v1/object/public/forum-media/user-1/orphan.webp";
    vi.mocked(uploadForumImage).mockResolvedValueOnce(uploadedUrl);
    vi.spyOn(forumService, "createThread").mockRejectedValueOnce(
      new Error("Thread creation failed"),
    );
    const { container } = render(
      <MemoryRouter>
        <ThreadForm />
      </MemoryRouter>,
    );

    await screen.findByText("General Discussion");
    fireEvent.change(container.querySelector('select[name="category"]')!, {
      target: { value: "cat-1" },
    });
    fireEvent.change(screen.getByPlaceholderText(/hidden cleopatra beach sunset cove/i), {
      target: { value: "Thread with orphan cover" },
    });
    fireEvent.change(screen.getByLabelText(/story/i), {
      target: { value: "A detailed story that fails during thread creation." },
    });
    fireEvent.change(screen.getByLabelText(/cover image/i), {
      target: { files: [new File(["image"], "cover.webp", { type: "image/webp" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: /publish post/i }));

    expect(await screen.findByText("Thread creation failed")).toBeInTheDocument();
    await waitFor(() => {
      expect(deleteForumImage).toHaveBeenCalledWith(uploadedUrl, "user-1");
    });
  });

  it("normalizes initial category from query param slug to backend category id", async () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/new-thread?category=general"]}>
        <ThreadForm />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("General Discussion")).toBeInTheDocument();
    });

    const categorySelect = container.querySelector('select[name="category"]')!;
    await waitFor(() => {
      expect(categorySelect).toHaveValue("cat-1");
    });

    const topicSelect = container.querySelector('select[name="subcategory"]')!;
    expect(topicSelect).toBeEnabled();
  });

  it("displays error message and does not show success screen when createThread fails", async () => {
    vi.spyOn(forumService, "createThread").mockRejectedValue(
      new Error("Server validation error")
    );

    const { container } = render(
      <MemoryRouter>
        <ThreadForm />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("General Discussion")).toBeInTheDocument();
    });

    const categorySelect = container.querySelector('select[name="category"]')!;
    fireEvent.change(categorySelect, { target: { value: "cat-1" } });

    const titleInput = screen.getByPlaceholderText(/hidden cleopatra beach sunset cove/i);
    fireEvent.change(titleInput, { target: { value: "My Awesome Thread Title" } });

    const contentInput = screen.getByLabelText(/story/i);
    fireEvent.change(contentInput, {
      target: { value: "This is a detailed post content with more than twenty characters long." },
    });

    const submitBtn = screen.getByRole("button", { name: /publish post/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Server validation error")).toBeInTheDocument();
    });

    expect(screen.queryByText("Discussion Created!")).not.toBeInTheDocument();
  });
});
