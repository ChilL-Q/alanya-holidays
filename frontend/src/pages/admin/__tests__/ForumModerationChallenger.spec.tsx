import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ForumModerationTab from "../components/ForumModerationTab";
import ForumPostPreviewModal from "../components/ForumPostPreviewModal";
import {
  adminService,
  type ForumReportAdminItem,
} from "@/api-services/admin.service";

describe("Empirical Challenge Suite: Forum Moderation UI/UX & State", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // Challenge 1: Empty Queues & Null States
  // =========================================================================
  describe("Challenge 1: Empty Queues & Null State Resilience", () => {
    it("should gracefully handle null stats and empty reports queue without crashing", async () => {
      const onCountUpdate = vi.fn();
      vi.spyOn(adminService, "getForumStats").mockResolvedValue(null);
      vi.spyOn(adminService, "getForumReports").mockResolvedValue([]);
      vi.spyOn(adminService, "getRemovedForumComments").mockResolvedValue([]);

      render(<ForumModerationTab onReportCountUpdate={onCountUpdate} />);

      // Verify empty state messages in reports list
      expect(
        await screen.findByText(/All forum content is clean/i, {}, { timeout: 5000 })
      ).toBeInTheDocument();
      expect(screen.getByText("No Reports Found")).toBeInTheDocument();

      // Verify stats display fallback defaults (0 / None)
      expect(screen.getByText("Total Topics")).toBeInTheDocument();
      expect(screen.getByText("None")).toBeInTheDocument();

      // Verify callback received 0 counts
      await waitFor(() => {
        expect(onCountUpdate).toHaveBeenCalledWith({ total: 0, pending: 0 });
      });
    });

    it("should display empty state in Removed Comments sub-tab when queue is empty", async () => {
      vi.spyOn(adminService, "getForumStats").mockResolvedValue({
        totalTopics: 10,
        totalReplies: 20,
        usersOnline: 5,
        latestMember: "Alice",
      });
      vi.spyOn(adminService, "getForumReports").mockResolvedValue([]);
      vi.spyOn(adminService, "getRemovedForumComments").mockResolvedValue([]);

      render(<ForumModerationTab />);

      // Switch to Removed Comments tab
      const removedTabBtn = await screen.findByRole(
        "button",
        { name: /removed comments/i },
        { timeout: 5000 }
      );
      fireEvent.click(removedTabBtn);

      expect(await screen.findByText("No Removed Comments")).toBeInTheDocument();
      expect(
        screen.getByText("No comments are currently soft-deleted.")
      ).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Challenge 2: Missing / Null / Undefined Fields & Avatars
  // =========================================================================
  describe("Challenge 2: Incomplete Data & Null Safety", () => {
    it("should safely render reports with missing reporter, null avatars, and undefined target objects", async () => {
      const edgeReports: ForumReportAdminItem[] = [
        {
          id: "rep-null-reporter",
          reporter_id: "user-orphan-999",
          target_type: "post",
          target_id: "post-orphan-888",
          reason: "spam",
          resolved: false,
          created_at: "2026-08-24T00:00:00Z",
          reporter: null, // null reporter object
          target_post: null, // null target post
        },
        {
          id: "rep-null-comment",
          reporter_id: "user-anon",
          target_type: "comment",
          target_id: "comment-orphan-777",
          reason: "inappropriate",
          resolved: true,
          created_at: "2026-08-24T01:00:00Z",
          reporter: {
            id: "user-anon",
            full_name: null,
            avatar_url: null,
          },
          target_comment: null, // null target comment
        },
      ];

      vi.spyOn(adminService, "getForumStats").mockResolvedValue(null);
      vi.spyOn(adminService, "getForumReports").mockResolvedValue(edgeReports);
      vi.spyOn(adminService, "getRemovedForumComments").mockResolvedValue([]);

      render(<ForumModerationTab />);

      // Verify fallback names and excerpt fallbacks
      expect(
        await screen.findByText("Post #post-orphan-888", {}, { timeout: 5000 })
      ).toBeInTheDocument();
      expect(screen.getByText("Comment #comment-orphan-777")).toBeInTheDocument();
      expect(screen.getAllByText("Anonymous").length).toBeGreaterThan(0);
    });

    it("should safely render modal preview when target post/comment has empty or undefined text", async () => {
      const minimalReport: ForumReportAdminItem = {
        id: "rep-empty-body",
        reporter_id: "u-1",
        target_type: "comment",
        target_id: "c-1",
        reason: "harassment",
        resolved: false,
        created_at: "2026-08-24T00:00:00Z",
        reporter: { full_name: "John Doe" },
        target_comment: {
          id: "c-1",
          post_id: "p-1",
          body: undefined, // undefined body
          is_removed: false,
          created_at: "2026-08-24T00:00:00Z",
        },
      };

      const onResolve = vi.fn().mockResolvedValue(undefined);
      const onToggleRemove = vi.fn().mockResolvedValue(undefined);

      render(
        <ForumPostPreviewModal
          report={minimalReport}
          isOpen={true}
          onClose={vi.fn()}
          onResolve={onResolve}
          onToggleRemove={onToggleRemove}
        />
      );

      expect(screen.getByText("No comment text available.")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText(/harassment/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Challenge 3: Long Text Overflow & Search Special Characters
  // =========================================================================
  describe("Challenge 3: Long Text Overflow & Search Robustness", () => {
    it("should handle huge strings and search containing regex special chars without throwing", async () => {
      const longTitle = "A".repeat(2000);
      const longContent = "B".repeat(5000);
      const xssReason = "<script>alert('xss')</script>";

      const extremeReport: ForumReportAdminItem = {
        id: "rep-extreme",
        reporter_id: "u-extreme",
        target_type: "post",
        target_id: "post-extreme",
        reason: xssReason,
        resolved: false,
        created_at: "2026-08-24T00:00:00Z",
        reporter: { full_name: "Türkçe Başlık Şövalyesi ğüşıöç" },
        target_post: {
          id: "post-extreme",
          title: longTitle,
          content: longContent,
          is_pinned: false,
          is_removed: false,
          created_at: "2026-08-24T00:00:00Z",
        },
      };

      vi.spyOn(adminService, "getForumStats").mockResolvedValue(null);
      vi.spyOn(adminService, "getForumReports").mockResolvedValue([extremeReport]);
      vi.spyOn(adminService, "getRemovedForumComments").mockResolvedValue([]);

      render(<ForumModerationTab />);

      expect(
        await screen.findByText("Türkçe Başlık Şövalyesi ğüşıöç", {}, { timeout: 5000 })
      ).toBeInTheDocument();
      expect(screen.getByText(xssReason)).toBeInTheDocument();

      // Test searching with special regex characters like [ * + ? ^ $ ( ) \
      const searchInput = screen.getByPlaceholderText(/Search by reporter, reason/i);
      fireEvent.change(searchInput, { target: { value: "[special*(regex+test?^$" } });

      // Search with non-matching query should show empty state safely without regex error
      expect(
        await screen.findByText(/No reports match your current filter/i)
      ).toBeInTheDocument();

      // Search with matching substring
      fireEvent.change(searchInput, { target: { value: "şövalyesi" } });
      expect(
        await screen.findByText("Türkçe Başlık Şövalyesi ğüşıöç")
      ).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Challenge 4: Rapid Button Clicking & Concurrency in Modal
  // =========================================================================
  describe("Challenge 4: Rapid Actions & Button Disabling", () => {
    it("should prevent duplicate invocations and disable buttons while action is in flight", async () => {
      let resolvePromiseResolver: () => void = () => {};
      const slowResolvePromise = new Promise<void>((res) => {
        resolvePromiseResolver = res;
      });

      const onResolve = vi.fn().mockImplementation(() => slowResolvePromise);
      const onToggleRemove = vi.fn().mockResolvedValue(undefined);

      const report: ForumReportAdminItem = {
        id: "rep-race-1",
        reporter_id: "u-1",
        target_type: "post",
        target_id: "post-1",
        reason: "spam",
        resolved: false,
        created_at: "2026-08-24T00:00:00Z",
        reporter: { full_name: "Bob" },
        target_post: {
          id: "post-1",
          title: "Spam Topic",
          content: "Spam Content",
          is_removed: false,
          is_pinned: false,
          created_at: "2026-08-24T00:00:00Z",
        },
      };

      render(
        <ForumPostPreviewModal
          report={report}
          isOpen={true}
          onClose={vi.fn()}
          onResolve={onResolve}
          onToggleRemove={onToggleRemove}
        />
      );

      const resolveBtn = screen.getByRole("button", { name: /mark as resolved/i });
      // First click
      fireEvent.click(resolveBtn);

      // Verify button shows loading state and is disabled
      expect(screen.getByRole("button", { name: /resolving\.\.\./i })).toBeDisabled();

      // Second rapid click while in flight should be blocked by disabled attribute
      fireEvent.click(resolveBtn);

      expect(onResolve).toHaveBeenCalledTimes(1);

      // Complete async action
      resolvePromiseResolver();
    });

    it("should require confirmation before executing hard delete", async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);
      const report: ForumReportAdminItem = {
        id: "rep-del-1",
        reporter_id: "u-1",
        target_type: "post",
        target_id: "post-del-1",
        reason: "harassment",
        resolved: false,
        created_at: "2026-08-24T00:00:00Z",
        target_post: {
          id: "post-del-1",
          title: "Delete Me",
          content: "Delete content",
          created_at: "2026-08-24T00:00:00Z",
        },
      };

      render(
        <ForumPostPreviewModal
          report={report}
          isOpen={true}
          onClose={vi.fn()}
          onResolve={vi.fn()}
          onToggleRemove={vi.fn()}
          onDelete={onDelete}
        />
      );

      // Click initial Hard Delete button
      const hardDeleteBtn = screen.getByRole("button", { name: /hard delete/i });
      fireEvent.click(hardDeleteBtn);

      // Verify confirmation warning is displayed
      expect(
        screen.getByText(/Permanently delete this post\? This cannot be undone\./i)
      ).toBeInTheDocument();
      expect(onDelete).not.toHaveBeenCalled();

      // Click Cancel
      const cancelBtn = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelBtn);

      // Confirmation dismissed without deleting
      expect(
        screen.queryByText(/Permanently delete this post/i)
      ).not.toBeInTheDocument();
      expect(onDelete).not.toHaveBeenCalled();

      // Re-trigger and confirm delete
      fireEvent.click(screen.getByRole("button", { name: /hard delete/i }));
      const confirmBtn = screen.getByRole("button", { name: /confirm delete/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledWith("post", "post-del-1");
      });
    });
  });

  // =========================================================================
  // Challenge 5: Network Failures & API Error Handling
  // =========================================================================
  describe("Challenge 5: Network Error & Rejection Tolerance", () => {
    it("should handle network rejections gracefully without crashing", async () => {
      vi.spyOn(adminService, "getForumStats").mockRejectedValue(new Error("Network Failure 500"));
      vi.spyOn(adminService, "getForumReports").mockRejectedValue(new Error("Gateway Timeout 504"));
      vi.spyOn(adminService, "getRemovedForumComments").mockRejectedValue(new Error("Server Error"));

      render(<ForumModerationTab />);

      // UI should survive and display empty states
      expect(
        await screen.findByText(/All forum content is clean/i, {}, { timeout: 5000 })
      ).toBeInTheDocument();
      expect(screen.getByText("Total Topics")).toBeInTheDocument();
    });

    it("should not alter local state when API action returns false (failure)", async () => {
      const mockReport: ForumReportAdminItem = {
        id: "rep-fail-1",
        reporter_id: "u-1",
        target_type: "post",
        target_id: "post-fail-1",
        reason: "spam",
        resolved: false,
        created_at: "2026-08-24T00:00:00Z",
        target_post: {
          id: "post-fail-1",
          title: "Failed Action Post",
          content: "Content",
          is_removed: false,
          created_at: "2026-08-24T00:00:00Z",
        },
      };

      vi.spyOn(adminService, "getForumStats").mockResolvedValue(null);
      vi.spyOn(adminService, "getForumReports").mockResolvedValue([mockReport]);
      vi.spyOn(adminService, "getRemovedForumComments").mockResolvedValue([]);
      // Simulate backend failure returning false
      vi.spyOn(adminService, "resolveForumReport").mockResolvedValue(false);

      render(<ForumModerationTab />);

      expect(
        await screen.findByText("Failed Action Post", {}, { timeout: 5000 })
      ).toBeInTheDocument();

      // Click Resolve button in table using exact title
      const resolveBtn = screen.getByTitle("Mark resolved");
      fireEvent.click(resolveBtn);

      await waitFor(() => {
        expect(adminService.resolveForumReport).toHaveBeenCalledWith("rep-fail-1");
      });

      // Status should remain Pending (not changed to Resolved)
      expect(screen.getByText("Pending")).toBeInTheDocument();
    });
  });
});
