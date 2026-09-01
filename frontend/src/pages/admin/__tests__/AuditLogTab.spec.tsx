import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AuditLogTab from "../components/AuditLogTab";
import {
  adminService,
  type ModerationAuditLogItem,
  type AuditLogPaginatedResult,
} from "@/api-services/admin.service";

describe("AuditLogTab", () => {
  const mockAuditLogs: ModerationAuditLogItem[] = [
    {
      id: "audit-101",
      entity_type: "listing",
      entity_id: "list-1",
      action: "approve",
      admin_id: "admin-uuid-1",
      reason: null,
      metadata: { score: 92, status: "approved" },
      created_at: "2026-08-24T10:00:00Z",
      admin: {
        id: "admin-uuid-1",
        full_name: "Sarah Jenkins",
        email: "sarah@alanyaholidays.com",
      },
    },
    {
      id: "audit-102",
      entity_type: "claim",
      entity_id: "claim-50",
      action: "reject",
      admin_id: "admin-uuid-2",
      reason: "Tax number does not match registered owner",
      metadata: { claimant_ip: "192.168.1.1" },
      created_at: "2026-08-24T09:30:00Z",
      admin: {
        id: "admin-uuid-2",
        full_name: "Alex Topal",
        email: "alex@alanyaholidays.com",
      },
    },
    {
      id: "audit-103",
      entity_type: "forum_report",
      entity_id: "rep-10",
      action: "resolve",
      admin_id: "admin-uuid-3",
      reason: "Spam removed",
      metadata: { target_post_id: "post-99" },
      created_at: "2026-08-23T18:00:00Z",
      admin: {
        id: "admin-uuid-3",
        full_name: "Elena Rostova",
        email: "elena@alanyaholidays.com",
      },
    },
  ];

  const defaultPaginatedResult: AuditLogPaginatedResult = {
    data: mockAuditLogs,
    total: 3,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(adminService, "getAuditLogs").mockResolvedValue(defaultPaginatedResult);
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it("should render audit log tab with title, filters, and records", async () => {
    const onCountUpdate = vi.fn();
    render(<AuditLogTab onCountUpdate={onCountUpdate} />);

    await waitFor(() => {
      expect(screen.getByText(/Universal Moderation Audit Log/i)).toBeInTheDocument();
      expect(screen.getByText("Sarah Jenkins")).toBeInTheDocument();
      expect(screen.getByText("Alex Topal")).toBeInTheDocument();
      expect(screen.getByText("Elena Rostova")).toBeInTheDocument();
      expect(screen.getByText("list-1")).toBeInTheDocument();
      expect(screen.getByText("claim-50")).toBeInTheDocument();
      expect(screen.getByText("Tax number does not match registered owner")).toBeInTheDocument();
    });

    expect(screen.getAllByText(/approve/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/reject/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/resolve/i).length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(onCountUpdate).toHaveBeenCalledWith({ total: 3 });
    });
  });

  it("should filter logs by entity type", async () => {
    render(<AuditLogTab />);

    await waitFor(() => {
      expect(screen.getByText("Sarah Jenkins")).toBeInTheDocument();
    });

    const entitySelect = screen.getByRole("combobox", { name: /Filter by Entity Type/i });
    fireEvent.change(entitySelect, { target: { value: "listing" } });

    await waitFor(() => {
      expect(adminService.getAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ entity_type: "listing" })
      );
    });
  });

  it("should filter logs by action", async () => {
    render(<AuditLogTab />);

    await waitFor(() => {
      expect(screen.getByText("Sarah Jenkins")).toBeInTheDocument();
    });

    const actionSelect = screen.getByRole("combobox", { name: /Filter by Action/i });
    fireEvent.change(actionSelect, { target: { value: "reject" } });

    await waitFor(() => {
      expect(adminService.getAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ action: "reject" })
      );
    });
  });

  it("should filter logs by search query keyword", async () => {
    render(<AuditLogTab />);

    await waitFor(() => {
      expect(screen.getByText("Sarah Jenkins")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Entity ID \/ Reason.../i);
    fireEvent.change(searchInput, { target: { value: "claim-50" } });

    await waitFor(() => {
      expect(adminService.getAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ search: "claim-50" })
      );
    });
  });

  it("should clear all filters when Clear All Filters button is clicked", async () => {
    render(<AuditLogTab />);

    await waitFor(() => {
      expect(screen.getByText("Sarah Jenkins")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Entity ID \/ Reason.../i);
    fireEvent.change(searchInput, { target: { value: "test-search" } });

    const clearBtn = await screen.findByRole("button", { name: /Clear All Filters/i });
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(searchInput).toHaveValue("");
    });
  });

  it("should open metadata inspection modal when Inspect button is clicked and copy json", async () => {
    render(<AuditLogTab />);

    await waitFor(() => {
      expect(screen.getByTestId("inspect-audit-audit-101")).toBeInTheDocument();
    });

    const inspectBtn = screen.getByTestId("inspect-audit-audit-101");
    fireEvent.click(inspectBtn);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Audit Event Payload/i })).toBeInTheDocument();
      expect(screen.getAllByText("audit-101").length).toBeGreaterThan(0);
      expect(screen.getByText(/Metadata JSON Payload/i)).toBeInTheDocument();
    });

    const copyBtn = screen.getByRole("button", { name: /Copy JSON/i });
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();

    // Close modal
    const closeBtns = screen.getAllByRole("button", { name: /close/i });
    fireEvent.click(closeBtns[0]);

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: /Audit Event Payload/i })).not.toBeInTheDocument();
    });

  });

  it("should display empty state when no audit records are found", async () => {
    vi.spyOn(adminService, "getAuditLogs").mockResolvedValueOnce({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    render(<AuditLogTab />);

    await waitFor(() => {
      expect(screen.getByText(/No audit logs found/i)).toBeInTheDocument();
    });
  });

  it("should handle error state and allow retrying", async () => {
    vi.spyOn(adminService, "getAuditLogs").mockRejectedValueOnce(new Error("API Down"));

    render(<AuditLogTab />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load moderation audit log/i)).toBeInTheDocument();
    });

    // Mock next successful call before clicking retry
    vi.spyOn(adminService, "getAuditLogs").mockResolvedValue(defaultPaginatedResult);
    const retryBtn = screen.getByRole("button", { name: /Retry/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText("Sarah Jenkins")).toBeInTheDocument();
    });
  });
});
