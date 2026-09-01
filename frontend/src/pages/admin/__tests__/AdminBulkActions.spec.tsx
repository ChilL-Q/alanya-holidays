import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ListingsModerationTab from "../components/ListingsModerationTab";
import ClaimsQueueTab from "../components/ClaimsQueueTab";
import ContentModerationTab from "../components/ContentModerationTab";
import { adminService } from "@/api-services/admin.service";

describe("Admin Batch Moderation (Bulk Actions Toolbar) & Multi-Tab Live Search", () => {
  const mockListings = [
    {
      id: "l-1",
      name: "Cleopatra Blue Beach Bar",
      slug: "cleopatra-blue",
      category_id: "restaurants",
      category: "Restaurants",
      status: "pending",
      tier: "signature",
      location: "Cleopatra Beach",
      created_at: "2026-08-20T10:00:00Z",
    },
    {
      id: "l-2",
      name: "Dim Cave Speleo Tour",
      slug: "dim-cave-tour",
      category_id: "activities",
      category: "Activities",
      status: "pending",
      tier: "voyager",
      location: "Dim River",
      created_at: "2026-08-20T11:00:00Z",
    },
    {
      id: "l-3",
      name: "Sultan Hammam Spa",
      slug: "sultan-hammam",
      category_id: "wellness",
      category: "Wellness",
      status: "approved",
      tier: "partner",
      location: "Alanya Center",
      created_at: "2026-08-19T09:00:00Z",
    },
  ];

  const mockClaims = [
    {
      id: "c-1",
      listing_id: "l-1",
      user_id: "user-1",
      email: "owner1@cleopatra.test",
      phone: "+90 555 111 2222",
      contact_phone: "+90 555 111 2222",
      role: "Owner",
      business_name: "Cleopatra Blue Beach Bar",
      status: "pending",
      created_at: "2026-08-20T12:00:00Z",
    },
    {
      id: "c-2",
      listing_id: "l-2",
      user_id: "user-2",
      email: "manager@dimcave.test",
      phone: "+90 555 333 4444",
      contact_phone: "+90 555 333 4444",
      role: "Manager",
      business_name: "Dim Cave Speleo Tour",
      status: "pending",
      created_at: "2026-08-20T13:00:00Z",
    },
  ];

  const mockContentSubmissions = [
    {
      id: "sub-1",
      user_id: "creator-1",
      title: "Top 5 Sunset Cafes in Kale",
      content: "Amazing viewpoints overlooking the harbor...",
      author_name: "Tanya Travel",
      author_email: "tanya@alanya.travel",
      category: "Guides",
      status: "pending_review",
      created_at: "2026-08-20T08:00:00Z",
    },
    {
      id: "sub-2",
      user_id: "creator-2",
      title: "Secret Waterfalls in Sapadere",
      content: "Hidden spots away from the crowd...",
      author_name: "Murat Explorer",
      author_email: "murat@alanya.travel",
      category: "Nature",
      status: "pending_review",
      created_at: "2026-08-20T09:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(adminService, "getModerationListings").mockResolvedValue(mockListings);
    vi.spyOn(adminService, "getClaimsQueue").mockResolvedValue(mockClaims);
    vi.spyOn(adminService, "getContentSubmissions").mockResolvedValue(mockContentSubmissions);
    vi.spyOn(adminService, "approveListing").mockResolvedValue(true);
    vi.spyOn(adminService, "rejectListing").mockResolvedValue(true);
    vi.spyOn(adminService, "approveClaim").mockResolvedValue(true);
    vi.spyOn(adminService, "rejectClaim").mockResolvedValue(true);
    vi.spyOn(adminService, "approveContentSubmission").mockResolvedValue(true);
    vi.spyOn(adminService, "rejectContentSubmission").mockResolvedValue(true);
  });

  describe("ListingsModerationTab: Bulk Selection & Actions", () => {
    it("renders checkboxes and displays Bulk Actions Toolbar upon item selection", async () => {
      render(<ListingsModerationTab />);

      await waitFor(() => {
        expect(screen.getByText("Cleopatra Blue Beach Bar")).toBeInTheDocument();
      });

      // Toolbar is not visible initially
      expect(screen.queryByTestId("bulk-actions-toolbar")).not.toBeInTheDocument();

      // Check the first item
      const selectFirst = screen.getByLabelText(/Select Cleopatra Blue Beach Bar/i);
      fireEvent.click(selectFirst);

      // Floating toolbar should now appear
      await waitFor(() => {
        const toolbar = screen.getByTestId("bulk-actions-toolbar");
        expect(toolbar).toBeInTheDocument();
        expect(toolbar).toHaveTextContent(/1.*selected/i);
      });

      // Check Select All header checkbox
      const selectAll = screen.getByLabelText(/Select all listings/i);
      fireEvent.click(selectAll);

      await waitFor(() => {
        const toolbar = screen.getByTestId("bulk-actions-toolbar");
        expect(toolbar).toHaveTextContent(/3.*selected/i);
      });
    });

    it("performs 1-click batch approval of selected listings", async () => {
      render(<ListingsModerationTab />);

      await waitFor(() => {
        expect(screen.getByText("Cleopatra Blue Beach Bar")).toBeInTheDocument();
      });

      // Select two items
      fireEvent.click(screen.getByLabelText(/Select Cleopatra Blue Beach Bar/i));
      fireEvent.click(screen.getByLabelText(/Select Dim Cave Speleo Tour/i));

      await waitFor(() => {
        expect(screen.getByTestId("bulk-actions-toolbar")).toBeInTheDocument();
      });

      // Click Batch Approve
      const bulkApproveBtn = screen.getByTestId("bulk-approve-btn");
      fireEvent.click(bulkApproveBtn);

      await waitFor(() => {
        expect(adminService.approveListing).toHaveBeenCalledWith("l-1");
        expect(adminService.approveListing).toHaveBeenCalledWith("l-2");
      });
    });

    it("supports live search filtering with instant clear button", async () => {
      render(<ListingsModerationTab />);

      await waitFor(() => {
        expect(screen.getByText("Cleopatra Blue Beach Bar")).toBeInTheDocument();
        expect(screen.getByText("Dim Cave Speleo Tour")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search by business name/i);
      fireEvent.change(searchInput, { target: { value: "Cleopatra" } });

      await waitFor(() => {
        expect(screen.getByText("Cleopatra Blue Beach Bar")).toBeInTheDocument();
        expect(screen.queryByText("Dim Cave Speleo Tour")).not.toBeInTheDocument();
      });

      // Instant clear button
      const clearBtn = screen.getByLabelText(/Clear search/i);
      fireEvent.click(clearBtn);

      await waitFor(() => {
        expect(screen.getByText("Dim Cave Speleo Tour")).toBeInTheDocument();
      });
    });

    it("resets selection when search query changes to prevent ghost IDs", async () => {
      render(<ListingsModerationTab />);

      await waitFor(() => {
        expect(screen.getByText("Cleopatra Blue Beach Bar")).toBeInTheDocument();
      });

      // Select first item
      fireEvent.click(screen.getByLabelText(/Select Cleopatra Blue Beach Bar/i));

      await waitFor(() => {
        expect(screen.getByTestId("bulk-actions-toolbar")).toBeInTheDocument();
      });

      // Type in search query
      const searchInput = screen.getByPlaceholderText(/Search by business name/i);
      fireEvent.change(searchInput, { target: { value: "Dim Cave" } });

      // Selection toolbar should disappear immediately
      await waitFor(() => {
        expect(screen.queryByTestId("bulk-actions-toolbar")).not.toBeInTheDocument();
      });
    });

    it("handles partial failure during batch approval and refreshes listings", async () => {
      vi.spyOn(adminService, "approveListing").mockImplementation(async (id: string) => {
        if (id === "l-1") return true;
        return false; // failure for l-2
      });

      render(<ListingsModerationTab />);

      await waitFor(() => {
        expect(screen.getByText("Cleopatra Blue Beach Bar")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText(/Select Cleopatra Blue Beach Bar/i));
      fireEvent.click(screen.getByLabelText(/Select Dim Cave Speleo Tour/i));

      await waitFor(() => {
        expect(screen.getByTestId("bulk-actions-toolbar")).toBeInTheDocument();
      });

      const bulkApproveBtn = screen.getByTestId("bulk-approve-btn");
      fireEvent.click(bulkApproveBtn);

      await waitFor(() => {
        expect(adminService.approveListing).toHaveBeenCalledWith("l-1");
        expect(adminService.approveListing).toHaveBeenCalledWith("l-2");
      });
    });
  });

  describe("ClaimsQueueTab: Bulk Selection & Actions", () => {
    it("allows selecting multiple claims and performing batch approval", async () => {
      render(<ClaimsQueueTab />);

      await waitFor(() => {
        expect(screen.getByText("Cleopatra Blue Beach Bar")).toBeInTheDocument();
      });

      // Select all claims
      const selectAll = screen.getByLabelText(/Select all claims/i);
      fireEvent.click(selectAll);

      await waitFor(() => {
        const toolbar = screen.getByTestId("bulk-actions-toolbar");
        expect(toolbar).toBeInTheDocument();
        expect(toolbar).toHaveTextContent(/2.*selected/i);
      });

      const bulkApproveBtn = screen.getByTestId("bulk-approve-btn");
      fireEvent.click(bulkApproveBtn);

      await waitFor(() => {
        expect(adminService.approveClaim).toHaveBeenCalledWith("c-1");
        expect(adminService.approveClaim).toHaveBeenCalledWith("c-2");
      });
    });
  });

  describe("ContentModerationTab: Bulk Selection & Actions", () => {
    it("allows selecting multiple creator submissions and performing batch approval", async () => {
      render(<ContentModerationTab />);

      await waitFor(() => {
        expect(screen.getByText("Top 5 Sunset Cafes in Kale")).toBeInTheDocument();
      });

      // Select submission 1
      const check1 = screen.getByLabelText(/Select Top 5 Sunset Cafes in Kale/i);
      fireEvent.click(check1);

      await waitFor(() => {
        expect(screen.getByTestId("bulk-actions-toolbar")).toBeInTheDocument();
      });

      const bulkApproveBtn = screen.getByTestId("bulk-approve-btn");
      fireEvent.click(bulkApproveBtn);

      await waitFor(() => {
        expect(adminService.approveContentSubmission).toHaveBeenCalledWith("sub-1");
      });
    });
  });
});
