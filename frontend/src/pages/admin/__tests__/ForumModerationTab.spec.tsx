import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ForumModerationTab from "../components/ForumModerationTab";
import { adminService, type ForumReportAdminItem, type ForumRemovedCommentItem, type ForumStatsAdminItem } from "@/api-services/admin.service";

describe("ForumModerationTab", () => {
  const mockStats: ForumStatsAdminItem = {
    totalTopics: 85,
    totalReplies: 340,
    usersOnline: 12,
    latestMember: "SelimAlanya",
  };

  const mockReports: ForumReportAdminItem[] = [
    {
      id: "rep-1",
      reporter_id: "u-100",
      target_type: "post",
      target_id: "post-101",
      reason: "spam",
      resolved: false,
      created_at: "2026-08-23T10:00:00Z",
      reporter: {
        full_name: "Fatima Demir",
        avatar_url: "https://example.com/fatima.jpg",
      },
      target_post: {
        id: "post-101",
        title: "Cheap crypto investment in Mahmutlar",
        content: "Click here to buy guaranteed crypto return links!",
        author_id: "spammer-1",
        is_pinned: false,
        is_removed: false,
        created_at: "2026-08-23T09:30:00Z",
      },
    },
    {
      id: "rep-2",
      reporter_id: "u-102",
      target_type: "comment",
      target_id: "com-202",
      reason: "harassment",
      resolved: true,
      created_at: "2026-08-22T15:00:00Z",
      reporter: {
        full_name: "Mehmet Kaya",
      },
      target_comment: {
        id: "com-202",
        post_id: "post-50",
        body: "Offensive abusive comment",
        user_id: "troll-1",
        is_removed: true,
        created_at: "2026-08-22T14:45:00Z",
      },
    },
  ];

  const mockRemovedComments: ForumRemovedCommentItem[] = [
    {
      id: "com-901",
      post_id: "post-50",
      user_id: "u-300",
      body: "Deleted abusive remark here",
      is_removed: true,
      created_at: "2026-08-21T11:00:00Z",
      author_name: "Troll User",
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(adminService, "getForumStats").mockResolvedValue(mockStats);
    vi.spyOn(adminService, "getForumReports").mockResolvedValue(mockReports);
    vi.spyOn(adminService, "getRemovedForumComments").mockResolvedValue(mockRemovedComments);
    vi.spyOn(adminService, "resolveForumReport").mockResolvedValue(true);
    vi.spyOn(adminService, "setForumPostRemoved").mockResolvedValue(true);
    vi.spyOn(adminService, "setForumPostPinned").mockResolvedValue(true);
    vi.spyOn(adminService, "deleteForumPost").mockResolvedValue(true);
    vi.spyOn(adminService, "setForumCommentRemoved").mockResolvedValue(true);
    vi.spyOn(adminService, "deleteForumComment").mockResolvedValue(true);
  });

  it("should render forum stats cards and reports list", async () => {
    const onCountUpdate = vi.fn();
    render(<ForumModerationTab onReportCountUpdate={onCountUpdate} />);

    // Check stats
    expect(await screen.findByText("85", {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText("340")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("SelimAlanya")).toBeInTheDocument();

    // Check reports listed
    expect(await screen.findByText("Cheap crypto investment in Mahmutlar", {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText("Fatima Demir")).toBeInTheDocument();
    expect(screen.getByText("spam")).toBeInTheDocument();

    // Callback called with count of pending reports (1 pending out of 2)
    await waitFor(() => {
      expect(onCountUpdate).toHaveBeenCalledWith(expect.objectContaining({ pending: 1, total: 2 }));
    });
  });

  it("should filter reports by status (pending vs resolved)", async () => {
    render(<ForumModerationTab />);

    await screen.findByText("Cheap crypto investment in Mahmutlar", {}, { timeout: 5000 });

    // Click 'Resolved' filter button
    const resolvedFilterBtn = screen.getByRole("button", { name: /^resolved/i });
    fireEvent.click(resolvedFilterBtn);

    // Resolved report should be visible
    expect(await screen.findByText(/Offensive abusive comment/i, {}, { timeout: 5000 })).toBeInTheDocument();
  });

  it("should open preview modal when Preview button is clicked", async () => {
    render(<ForumModerationTab />);

    const previewBtns = await screen.findAllByRole("button", { name: /preview/i }, { timeout: 5000 });
    fireEvent.click(previewBtns[0]);

    // Modal opens
    expect(await screen.findByText(/Report Inspection/i, {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText(/Click here to buy guaranteed crypto return links!/i)).toBeInTheDocument();

    // Close modal
    const closeBtns = screen.getAllByRole("button", { name: /close/i });
    fireEvent.click(closeBtns[0]);
    await waitFor(() => {
      expect(screen.queryByText(/Report Inspection/i)).not.toBeInTheDocument();
    });
  });

  it("should resolve a report from preview modal", async () => {
    render(<ForumModerationTab />);

    const previewBtns = await screen.findAllByRole("button", { name: /preview/i }, { timeout: 5000 });
    fireEvent.click(previewBtns[0]);

    const resolveBtn = await screen.findByRole("button", { name: /mark as resolved/i }, { timeout: 5000 });
    fireEvent.click(resolveBtn);

    await waitFor(() => {
      expect(adminService.resolveForumReport).toHaveBeenCalledWith("rep-1");
    });
  });

  it("should toggle soft remove / restore on reported content", async () => {
    render(<ForumModerationTab />);

    const previewBtns = await screen.findAllByRole("button", { name: /preview/i }, { timeout: 5000 });
    fireEvent.click(previewBtns[0]);

    const removeBtn = await screen.findByRole("button", { name: /remove post/i }, { timeout: 5000 });
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(adminService.setForumPostRemoved).toHaveBeenCalledWith("post-101", true);
    });
  });

  it("should switch to Removed Comments sub-tab and display removed comments", async () => {
    render(<ForumModerationTab />);

    const removedTabBtn = await screen.findByRole("button", { name: /removed comments/i }, { timeout: 5000 });
    fireEvent.click(removedTabBtn);

    expect(await screen.findByText("Deleted abusive remark here", {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText("Troll User")).toBeInTheDocument();
  });

  it("should show an explicit error banner when forum moderation data fails to load", async () => {
    vi.spyOn(adminService, "getForumStats").mockRejectedValueOnce(new Error("API down"));

    render(<ForumModerationTab />);

    expect(
      await screen.findByText(/Failed to load forum moderation data\. Please try again\./i)
    ).toBeInTheDocument();
  });

  it("preserves an orphaned resolved report and disables invalid target actions", async () => {
    vi.spyOn(adminService, "getForumReports").mockResolvedValueOnce([
      {
        id: "rep-orphan",
        reporter_id: "u-100",
        target_type: "post",
        target_id: "post-deleted",
        reason: "spam",
        resolved: true,
        target_missing: true,
        target_post: null,
        created_at: "2026-08-23T10:00:00Z",
      },
    ]);

    render(<ForumModerationTab />);

    const preview = await screen.findByRole("button", { name: /preview/i });
    expect(screen.getByText(/deleted post/i)).toBeInTheDocument();
    const row = preview.closest("tr");
    expect(row?.querySelector("button[disabled]")).toBeTruthy();

    fireEvent.click(preview);
    expect(await screen.findByText(/permanently deleted/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /remove post/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /hard delete/i })).not.toBeInTheDocument();
  });

  it("shows an actionable error and keeps the modal open when hard delete fails", async () => {
    vi.spyOn(adminService, "deleteForumPost").mockResolvedValueOnce(false);
    render(<ForumModerationTab />);

    fireEvent.click((await screen.findAllByRole("button", { name: /preview/i }))[0]);
    fireEvent.click(await screen.findByRole("button", { name: /hard delete/i }));
    fireEvent.click(await screen.findByRole("button", { name: /confirm delete/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/failed to load forum moderation data/i);
    expect(screen.getByText(/report inspection/i)).toBeInTheDocument();
  });
});
