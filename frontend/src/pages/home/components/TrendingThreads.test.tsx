import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { forumService, type CategoryThread } from "@/api-services/forum.service";
import TrendingThreads from "./TrendingThreads";
import i18n from "@/i18n";

function makeThread(overrides: Partial<CategoryThread>): CategoryThread {
  return {
    id: "thread-1",
    title: "Alanya discussion",
    category: "Travel",
    categoryId: "travel",
    author: "Alanya Member",
    authorAvatar: "/images/avatar.svg",
    replies: 2,
    views: 25,
    likes: 3,
    postedAt: "1h ago",
    isHot: false,
    excerpt: "A useful community discussion.",
    ...overrides,
  };
}

describe("TrendingThreads", () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    await i18n.changeLanguage("en");
  });

  it("uses post cover, then category image, then placeholder", async () => {
    vi.spyOn(forumService, "getTrendingThreads").mockResolvedValue([
      makeThread({
        id: "post-cover",
        imageUrl: "https://cdn.example.com/post.webp",
        categoryImageUrl: "https://cdn.example.com/category.webp",
      }),
      makeThread({
        id: "category-cover",
        imageUrl: undefined,
        categoryImageUrl: "https://cdn.example.com/category.webp",
      }),
      makeThread({
        id: "placeholder-cover",
        imageUrl: undefined,
        categoryImageUrl: undefined,
      }),
    ]);

    const { container } = render(
      <MemoryRouter>
        <TrendingThreads />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(container.querySelector('a[href="/thread/post-cover"]')).toBeInTheDocument();
    });

    const coverFor = (id: string) =>
      container.querySelector<HTMLImageElement>(`a[href="/thread/${id}"] img`);

    expect(coverFor("post-cover")).toHaveAttribute("src", "https://cdn.example.com/post.webp");
    expect(coverFor("category-cover")).toHaveAttribute(
      "src",
      "https://cdn.example.com/category.webp",
    );
    expect(coverFor("placeholder-cover")).toHaveAttribute(
      "src",
      "/images/placeholder-business.svg",
    );
  });

  it("localizes the section chrome in Russian while preserving thread content", async () => {
    await i18n.changeLanguage("ru");
    vi.spyOn(forumService, "getTrendingThreads").mockResolvedValue([
      makeThread({ title: "Alanya discussion" }),
    ]);

    render(
      <MemoryRouter>
        <TrendingThreads />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Горячие обсуждения" })).toBeInTheDocument();
    expect(screen.getByText("Сейчас в тренде")).toBeInTheDocument();
    expect(screen.getByText("Alanya discussion")).toBeInTheDocument();
  });
});
