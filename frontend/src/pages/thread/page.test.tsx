import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { forumService, type ThreadDetail } from "@/api-services/forum.service";
import ThreadPage from "./page";

const authState = vi.hoisted(() => ({
  user: null as { id: string } | null,
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: authState.user }),
}));

vi.mock("@/pages/home/components/Navbar", () => ({ default: () => <nav /> }));
vi.mock("@/pages/home/components/Footer", () => ({ default: () => <footer /> }));
vi.mock("./components/ThreadHero", () => ({ default: () => <div /> }));
vi.mock("./components/OriginalPost", () => ({ default: () => <article /> }));
vi.mock("./components/ReplyCard", () => ({ default: () => <article /> }));
vi.mock("./components/AuthorSidebar", () => ({ default: () => <aside /> }));

const thread: ThreadDetail = {
  id: "thread-1",
  title: "Community question",
  category: "General Discussion",
  categoryId: "general",
  author: "Community Member",
  authorAvatar: "/avatar.svg",
  authorRole: "Member",
  authorBio: "",
  authorPosts: 1,
  authorReputation: 1,
  authorJoinDate: "2026",
  authorLocation: "Alanya",
  authorBadges: [],
  content: "Question body",
  postedAt: "today",
  views: 1,
  likes: 0,
  isLiked: false,
  isPinned: false,
  isHot: false,
  isVerified: false,
  replies: [],
};

function renderThreadPage() {
  return render(
    <MemoryRouter initialEntries={["/thread/thread-1"]}>
      <Routes>
        <Route path="/thread/:threadId" element={<ThreadPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ThreadPage reply access", () => {
  beforeEach(() => {
    authState.user = null;
    vi.spyOn(forumService, "getThreadById").mockResolvedValue(thread);
    vi.spyOn(forumService, "incrementPostView").mockResolvedValue(undefined);
  });

  it("replaces the comment editor with authentication actions for guests", async () => {
    renderThreadPage();

    expect(await screen.findByText("Sign in to join the discussion")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/share your thoughts/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Post Comment" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in to comment" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/register");
  });

  it("keeps the comment editor available to authenticated users", async () => {
    authState.user = { id: "user-1" };

    renderThreadPage();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/share your thoughts/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Post Comment" })).toBeInTheDocument();
    expect(screen.queryByText("Sign in to join the discussion")).not.toBeInTheDocument();
  });
});
