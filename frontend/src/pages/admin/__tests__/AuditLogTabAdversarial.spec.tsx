import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AuditLogTab from "../components/AuditLogTab";
import {
  adminService,
  type ModerationAuditLogItem,
  type AuditLogPaginatedResult,
} from "@/api-services/admin.service";

describe("AuditLogTab — Empirical Adversarial Stress Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  describe("1. Empty States & Malformed API Payloads", () => {
    it("should render clean empty state when no audit records exist on platform", async () => {
      const onCountUpdate = vi.fn();
      vi.spyOn(adminService, "getAuditLogs").mockResolvedValueOnce({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      render(<AuditLogTab onCountUpdate={onCountUpdate} />);

      await waitFor(() => {
        expect(screen.getByText(/No audit logs found/i)).toBeInTheDocument();
        expect(
          screen.getByText(/No moderation audit events have been logged on the platform yet/i)
        ).toBeInTheDocument();
      });

      expect(onCountUpdate).toHaveBeenCalledWith({ total: 0 });
      // Ensure no pagination bar is rendered
      expect(screen.queryByText(/Showing/i)).not.toBeInTheDocument();
    });

    it("should handle null or undefined data field in API response gracefully without crashing", async () => {
      vi.spyOn(adminService, "getAuditLogs").mockResolvedValueOnce({
        data: null,
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      } as unknown as AuditLogPaginatedResult);

      render(<AuditLogTab />);

      await waitFor(() => {
        expect(screen.getByText(/No audit logs found/i)).toBeInTheDocument();
      });
    });

    it("should show contextual filter empty state and allow resetting filters via Reset Filters button", async () => {
      vi.spyOn(adminService, "getAuditLogs").mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      render(<AuditLogTab />);

      // Apply entity filter
      const entitySelect = screen.getByRole("combobox", { name: /Filter by Entity Type/i });
      fireEvent.change(entitySelect, { target: { value: "blog_submission" } });

      await waitFor(() => {
        expect(
          screen.getByText(/No audit records matched your active filter parameters/i)
        ).toBeInTheDocument();
      });

      // Click Reset Filters button inside empty state
      const resetBtn = screen.getByRole("button", { name: /Reset Filters/i });
      fireEvent.click(resetBtn);

      await waitFor(() => {
        expect(entitySelect).toHaveValue("all");
      });
    });
  });

  describe("2. Deep, Complex & Malformed JSON Payloads in Modal", () => {
    const complexItem: ModerationAuditLogItem = {
      id: "audit-complex-999",
      entity_type: "listing",
      entity_id: "list-xss-1",
      action: "update_score",
      admin_id: "adm-1",
      reason: "XSS & Unicode check: <script>alert(1)</script> 🇹🇷 Şevket & Co.",
      metadata: {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  tags: ["tag1", "tag2", "<html>injection</html>"],
                  turkishText: "Alanya Kalesi Manzarası & Balıkçı Barınağı",
                  specialChars: "\"quotes\", 'single', `backticks`, \\slashes\\",
                  largeNumber: 999999999999,
                  booleanVal: true,
                  nullVal: null,
                },
              },
            },
          },
        },
      },
      created_at: "2026-08-24T14:30:00.000Z",
      admin: {
        id: "adm-1",
        full_name: "Şevket Çavuş",
        email: "sevket@alanya.test",
      },
    };

    it("should render deep JSON metadata accurately and allow copying to clipboard", async () => {
      vi.spyOn(adminService, "getAuditLogs").mockResolvedValueOnce({
        data: [complexItem],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      render(<AuditLogTab />);

      await waitFor(() => {
        expect(screen.getByText("Şevket Çavuş")).toBeInTheDocument();
      });

      // Open inspection modal
      const inspectBtn = screen.getByTestId(`inspect-audit-${complexItem.id}`);
      fireEvent.click(inspectBtn);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /Audit Event Payload/i })).toBeInTheDocument();
        expect(screen.getByText(/Alanya Kalesi Manzarası/i)).toBeInTheDocument();
      });

      // Test Copy JSON button
      const copyBtn = screen.getByRole("button", { name: /Copy JSON/i });
      fireEvent.click(copyBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        JSON.stringify(complexItem.metadata, null, 2)
      );
      expect(screen.getByText(/Copied!/i)).toBeInTheDocument();

      // Close modal via close button
      const closeButtons = screen.getAllByRole("button", { name: /close/i });
      fireEvent.click(closeButtons[0]);

      await waitFor(() => {
        expect(
          screen.queryByRole("heading", { name: /Audit Event Payload/i })
        ).not.toBeInTheDocument();
      });
    });

    it("should handle null or missing metadata gracefully without throwing in modal", async () => {
      const nullMetaItem: ModerationAuditLogItem = {
        id: "audit-null-meta",
        entity_type: "claim",
        entity_id: "claim-000",
        action: "reject",
        admin_id: "adm-none",
        reason: null,
        metadata: null,
        created_at: "2026-08-24T12:00:00Z",
        admin: null,
      };

      vi.spyOn(adminService, "getAuditLogs").mockResolvedValueOnce({
        data: [nullMetaItem],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      render(<AuditLogTab />);

      await waitFor(() => {
        expect(screen.getByText("claim-000")).toBeInTheDocument();
      });

      // Open modal
      const inspectBtn = screen.getByTestId(`inspect-audit-${nullMetaItem.id}`);
      fireEvent.click(inspectBtn);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /Audit Event Payload/i })).toBeInTheDocument();
      });

      const copyBtn = screen.getByRole("button", { name: /Copy JSON/i });
      expect(() => fireEvent.click(copyBtn)).not.toThrow();
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(JSON.stringify({}, null, 2));
    });
  });

  describe("3. Rapid Filter Switching, Pagination & Race Conditions", () => {
    it("should reset currentPage to 1 when changing search keyword or date filters", async () => {
      const mockResult: AuditLogPaginatedResult = {
        data: [
          {
            id: "audit-p2",
            entity_type: "listing",
            entity_id: "list-p2",
            action: "approve",
            admin_id: "adm-1",
            reason: null,
            metadata: {},
            created_at: "2026-08-24T12:00:00Z",
            admin: { id: "adm-1", full_name: "Admin User" },
          },
        ],
        total: 45,
        page: 2,
        limit: 20,
        totalPages: 3,
      };

      vi.spyOn(adminService, "getAuditLogs").mockResolvedValue(mockResult);

      render(<AuditLogTab />);

      await waitFor(() => {
        expect(screen.getByText(/Page 1 of 3/i)).toBeInTheDocument();
      });

      // Go to Next page
      const nextBtn = screen.getByRole("button", { name: /Next/i });
      fireEvent.click(nextBtn);

      await waitFor(() => {
        expect(adminService.getAuditLogs).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 })
        );
      });

      // Type in search query -> must reset page to 1
      const searchInput = screen.getByPlaceholderText(/Entity ID \/ Reason.../i);
      fireEvent.change(searchInput, { target: { value: "search-query" } });

      await waitFor(() => {
        expect(adminService.getAuditLogs).toHaveBeenCalledWith(
          expect.objectContaining({ page: 1, search: "search-query" })
        );
      });
    });

    it("should handle date range filters (startDate & endDate)", async () => {
      vi.spyOn(adminService, "getAuditLogs").mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const { container } = render(<AuditLogTab />);

      await waitFor(() => {
        expect(adminService.getAuditLogs).toHaveBeenCalled();
      });

      const dateInputs = container.querySelectorAll<HTMLInputElement>('input[type="date"]');
      expect(dateInputs.length).toBe(2);

      const fromDateInput = dateInputs[0];
      const toDateInput = dateInputs[1];

      fireEvent.change(fromDateInput, { target: { value: "2026-08-01" } });
      fireEvent.change(toDateInput, { target: { value: "2026-08-24" } });

      await waitFor(() => {
        expect(adminService.getAuditLogs).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: "2026-08-01",
            endDate: "2026-08-24",
          })
        );
      });
    });

    it("should handle boundary clicks on Previous and Next pagination buttons safely", async () => {
      const mockResult: AuditLogPaginatedResult = {
        data: [
          {
            id: "a-1",
            entity_type: "listing",
            entity_id: "l-1",
            action: "verify",
            admin_id: "adm-1",
            reason: null,
            metadata: {},
            created_at: "2026-08-24T12:00:00Z",
          },
        ],
        total: 40,
        page: 1,
        limit: 20,
        totalPages: 2,
      };

      vi.spyOn(adminService, "getAuditLogs").mockResolvedValue(mockResult);

      render(<AuditLogTab />);

      await waitFor(() => {
        expect(screen.getByText(/Page 1 of 2/i)).toBeInTheDocument();
      });

      const prevBtn = screen.getByRole("button", { name: /Previous/i });
      expect(prevBtn).toBeDisabled();

      // Click next
      const nextBtn = screen.getByRole("button", { name: /Next/i });
      fireEvent.click(nextBtn);

      await waitFor(() => {
        expect(screen.getByText(/Page 2 of 2/i)).toBeInTheDocument();
      });

      const nextBtnDisabled = screen.getByRole("button", { name: /Next/i });
      expect(nextBtnDisabled).toBeDisabled();
    });
  });

  describe("4. Error Handling, Network Recovery & Retries", () => {
    it("should render error message with alert role and recover when Retry button is clicked", async () => {
      vi.spyOn(adminService, "getAuditLogs")
        .mockRejectedValueOnce(new Error("500 Internal Server Error"))
        .mockResolvedValueOnce({
          data: [
            {
              id: "recovered-log-1",
              entity_type: "forum_post",
              entity_id: "post-88",
              action: "pin",
              admin_id: "adm-1",
              reason: "Important announcement",
              metadata: {},
              created_at: "2026-08-24T11:00:00Z",
              admin: { id: "adm-1", full_name: "Moderator Jack" },
            },
          ],
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        });

      render(<AuditLogTab />);

      // Verify alert banner appears
      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(
          screen.getByText(/Failed to load moderation audit log. Please try again./i)
        ).toBeInTheDocument();
      });

      // Click Retry
      const retryBtn = screen.getByRole("button", { name: /Retry/i });
      fireEvent.click(retryBtn);

      // Verify recovered state
      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(screen.getByText("Moderator Jack")).toBeInTheDocument();
        expect(screen.getByText("post-88")).toBeInTheDocument();
      });
    });

    it("should allow manual refresh via header Refresh button", async () => {
      const getAuditLogsSpy = vi.spyOn(adminService, "getAuditLogs").mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      render(<AuditLogTab />);

      await waitFor(() => {
        expect(getAuditLogsSpy).toHaveBeenCalledTimes(1);
      });

      const refreshBtn = screen.getByRole("button", { name: /Refresh/i });
      fireEvent.click(refreshBtn);

      await waitFor(() => {
        expect(getAuditLogsSpy).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("5. Defensive Field Formatting & Fallbacks", () => {
    it("should render fallback initials and 'Admin' label when admin profile is null", async () => {
      const anonymizedItem: ModerationAuditLogItem = {
        id: "audit-anon-1",
        entity_type: "forum_comment",
        entity_id: "com-77",
        action: "remove",
        admin_id: null,
        reason: "Inappropriate language",
        metadata: { word_count: 50 },
        created_at: "2026-08-24T08:00:00Z",
        admin: null,
      };

      vi.spyOn(adminService, "getAuditLogs").mockResolvedValueOnce({
        data: [anonymizedItem],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      render(<AuditLogTab />);

      await waitFor(() => {
        expect(screen.getByText("Admin")).toBeInTheDocument();
        expect(screen.getByText("A")).toBeInTheDocument();
        expect(screen.getByText("Inappropriate language")).toBeInTheDocument();
      });
    });

    it("should render unknown action strings gracefully with default badge and icon styling", async () => {
      const customActionItem: ModerationAuditLogItem = {
        id: "audit-custom-act",
        entity_type: "blog_post",
        entity_id: "blog-100",
        action: "custom_audit_hook",
        admin_id: "adm-99",
        reason: null,
        metadata: {},
        created_at: "invalid-date-string-test",
        admin: { id: "adm-99", full_name: "Special Agent" },
      };

      vi.spyOn(adminService, "getAuditLogs").mockResolvedValueOnce({
        data: [customActionItem],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      render(<AuditLogTab />);

      await waitFor(() => {
        expect(screen.getByText("Special Agent")).toBeInTheDocument();
        // Notice item.action.replace(/_/g, " ") replaces all underscores
        expect(screen.getByText("custom audit hook")).toBeInTheDocument();
        // invalid date string should fallback to raw string without throwing
        expect(screen.getByText("invalid-date-string-test")).toBeInTheDocument();
      });
    });
  });
});
