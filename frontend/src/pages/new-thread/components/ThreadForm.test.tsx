import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ThreadForm from "./ThreadForm";
import { forumService } from "@/api-services/forum.service";

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
