import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ThreadForm from "./ThreadForm";
import { forumService } from "@/api-services/forum.service";

describe("ThreadForm Success Navigation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(forumService, "getCategories").mockResolvedValue([
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
    ]);
  });

  it("renders SPA Link components for success action buttons", async () => {
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

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText("General Discussion")).toBeInTheDocument();
    });

    // Select category
    const categorySelect = container.querySelector('select[name="category"]')!;
    fireEvent.change(categorySelect, { target: { value: "cat-1" } });

    // Fill title and content
    const titleInput = screen.getByPlaceholderText(/best neighborhood/i);
    fireEvent.change(titleInput, { target: { value: "My Awesome Thread Title" } });

    const contentInput = screen.getByPlaceholderText(/share your thoughts/i);
    fireEvent.change(contentInput, {
      target: { value: "This is a detailed post content with more than twenty characters long." },
    });

    // Submit form
    const submitBtn = screen.getByRole("button", { name: /post discussion/i });
    fireEvent.click(submitBtn);

    // Verify success state
    await waitFor(() => {
      expect(screen.getByText("Discussion Created!")).toBeInTheDocument();
    });

    const threadLink = screen.getByRole("link", { name: /view your thread/i });
    expect(threadLink).toHaveAttribute("href", "/thread/awesome-thread");

    const categoryLink = screen.getByRole("link", { name: /view in general discussion/i });
    expect(categoryLink).toHaveAttribute("href", "/category/general");
  });

  it("displays error message and does not show success screen when createThread fails", async () => {
    vi.spyOn(forumService, "createThread").mockRejectedValue(new Error("Server validation error"));

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

    const titleInput = screen.getByPlaceholderText(/best neighborhood/i);
    fireEvent.change(titleInput, { target: { value: "My Awesome Thread Title" } });

    const contentInput = screen.getByPlaceholderText(/share your thoughts/i);
    fireEvent.change(contentInput, {
      target: { value: "This is a detailed post content with more than twenty characters long." },
    });

    const submitBtn = screen.getByRole("button", { name: /post discussion/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Server validation error")).toBeInTheDocument();
    });

    expect(screen.queryByText("Discussion Created!")).not.toBeInTheDocument();
  });
});
