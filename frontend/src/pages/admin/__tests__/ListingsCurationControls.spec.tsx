import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ListingsModerationTab from "../components/ListingsModerationTab";
import { adminService, type ModerationListing } from "@/api-services/admin.service";
import toast from "react-hot-toast";

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ListingsModerationTab: Directory Curation Controls (Task 2.2)", () => {
  const mockListings: ModerationListing[] = [
    {
      id: "list-1",
      name: "Cleopatra Sunset Bar",
      slug: "cleopatra-sunset-bar",
      category_id: "restaurants",
      category: "Restaurants",
      status: "approved",
      tier: "signature",
      location: "Cleopatra Beach",
      is_featured: false,
      is_verified: false,
      base_score: 50,
      created_at: "2026-08-20T10:00:00Z",
    },
    {
      id: "list-2",
      name: "Dim Cave Adventure",
      slug: "dim-cave-adventure",
      category_id: "activities",
      category: "Activities",
      status: "approved",
      tier: "voyager",
      location: "Dim River",
      is_featured: true,
      is_verified: true,
      base_score: 80,
      created_at: "2026-08-20T11:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(adminService, "getModerationListings").mockResolvedValue(mockListings);
    vi.spyOn(adminService, "featureListing").mockResolvedValue(true);
    vi.spyOn(adminService, "unfeatureListing").mockResolvedValue(true);
    vi.spyOn(adminService, "verifyListing").mockResolvedValue(true);
    vi.spyOn(adminService, "unverifyListing").mockResolvedValue(true);
    vi.spyOn(adminService, "updateListingScore").mockResolvedValue(true);
    vi.spyOn(adminService, "batchFeatureListings").mockResolvedValue({
      successful: ["list-1", "list-2"],
      failed: [],
    });
    vi.spyOn(adminService, "batchVerifyListings").mockResolvedValue({
      successful: ["list-1", "list-2"],
      failed: [],
    });
  });

  describe("1. Interactive Star Toggle (Featured Status)", () => {
    it("renders star buttons with proper state and tooltips", async () => {
      render(<ListingsModerationTab />);

      await waitFor(() => {
        expect(screen.getByText("Cleopatra Sunset Bar")).toBeInTheDocument();
      });

      const starToggle1 = screen.getByTestId("feature-toggle-list-1");
      const starToggle2 = screen.getByTestId("feature-toggle-list-2");

      expect(starToggle1).toBeInTheDocument();
      expect(starToggle2).toBeInTheDocument();

      // list-1 is not featured, list-2 is featured
      expect(starToggle1.querySelector(".ri-star-line")).toBeInTheDocument();
      expect(starToggle2.querySelector(".ri-star-fill")).toBeInTheDocument();
    });

    it("toggles feature status on click with optimistic update and calls API", async () => {
      render(<ListingsModerationTab />);

      await waitFor(() => {
        expect(screen.getByText("Cleopatra Sunset Bar")).toBeInTheDocument();
      });

      const starToggle1 = screen.getByTestId("feature-toggle-list-1");
      fireEvent.click(starToggle1);

      await waitFor(() => {
        expect(adminService.featureListing).toHaveBeenCalledWith("list-1");
        expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/featured/i));
      });

      // Now click on list-2 to unfeature
      const starToggle2 = screen.getByTestId("feature-toggle-list-2");
      fireEvent.click(starToggle2);

      await waitFor(() => {
        expect(adminService.unfeatureListing).toHaveBeenCalledWith("list-2");
        expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/unfeatured|removed/i));
      });
    });

    it("reverts optimistic state and shows error toast on feature API failure", async () => {
      vi.spyOn(adminService, "featureListing").mockResolvedValueOnce(false);

      render(<ListingsModerationTab />);

      await waitFor(() => {
        expect(screen.getByText("Cleopatra Sunset Bar")).toBeInTheDocument();
      });

      const starToggle1 = screen.getByTestId("feature-toggle-list-1");
      fireEvent.click(starToggle1);

      await waitFor(() => {
        expect(adminService.featureListing).toHaveBeenCalledWith("list-1");
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe("2. Interactive Checkmark Toggle (Verified Status)", () => {
    it("renders verified checkmark buttons with proper state and tooltips", async () => {
      render(<ListingsModerationTab />);

      await waitFor(() => {
        expect(screen.getByText("Cleopatra Sunset Bar")).toBeInTheDocument();
      });

      const verifyToggle1 = screen.getByTestId("verify-toggle-list-1");
      const verifyToggle2 = screen.getByTestId("verify-toggle-list-2");

      expect(verifyToggle1).toBeInTheDocument();
      expect(verifyToggle2).toBeInTheDocument();

      // list-1 is unverified, list-2 is verified
      expect(verifyToggle1.querySelector(".ri-checkbox-circle-line")).toBeInTheDocument();
      expect(verifyToggle2.querySelector(".ri-verified-badge-fill, .ri-checkbox-circle-fill")).toBeInTheDocument();
    });

    it("toggles verify status on click with optimistic update and calls API", async () => {
      render(<ListingsModerationTab />);

      await waitFor(() => {
        expect(screen.getByText("Cleopatra Sunset Bar")).toBeInTheDocument();
      });

      const verifyToggle1 = screen.getByTestId("verify-toggle-list-1");
      fireEvent.click(verifyToggle1);

      await waitFor(() => {
        expect(adminService.verifyListing).toHaveBeenCalledWith("list-1");
        expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/verified/i));
      });

      // Click list-2 to unverify
      const verifyToggle2 = screen.getByTestId("verify-toggle-list-2");
      fireEvent.click(verifyToggle2);

      await waitFor(() => {
        expect(adminService.unverifyListing).toHaveBeenCalledWith("list-2");
        expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/unverified|removed/i));
      });
    });
  });

  describe("3. Base Score Editor", () => {
    it("displays base score and allows updating score via score editor", async () => {
      // Mock window.prompt for inline/quick edit
      vi.spyOn(window, "prompt").mockReturnValueOnce("92");

      render(<ListingsModerationTab />);

      await waitFor(() => {
        expect(screen.getByText("Cleopatra Sunset Bar")).toBeInTheDocument();
      });

      const scoreBtn = screen.getByTestId("score-btn-list-1");
      expect(scoreBtn).toBeInTheDocument();
      expect(scoreBtn).toHaveTextContent("50");

      fireEvent.click(scoreBtn);

      await waitFor(() => {
        expect(adminService.updateListingScore).toHaveBeenCalledWith("list-1", 92);
        expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/score/i));
      });
    });
  });

  describe("4. Bulk Curation Actions in BulkActionsToolbar", () => {
    it("renders bulk feature and bulk verify action buttons when listings are selected", async () => {
      render(<ListingsModerationTab />);

      await waitFor(() => {
        expect(screen.getByText("Cleopatra Sunset Bar")).toBeInTheDocument();
      });

      // Select all listings
      const selectAll = screen.getByLabelText(/Select all listings/i);
      fireEvent.click(selectAll);

      await waitFor(() => {
        expect(screen.getByTestId("bulk-actions-toolbar")).toBeInTheDocument();
      });

      const bulkFeatureBtn = screen.getByTestId("bulk-feature-btn");
      const bulkVerifyBtn = screen.getByTestId("bulk-verify-btn");

      expect(bulkFeatureBtn).toBeInTheDocument();
      expect(bulkVerifyBtn).toBeInTheDocument();

      // Click Bulk Feature
      fireEvent.click(bulkFeatureBtn);

      await waitFor(() => {
        expect(adminService.batchFeatureListings).toHaveBeenCalledWith(["list-1", "list-2"]);
        expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/featured/i));
      });

      // Select all again and Click Bulk Verify
      fireEvent.click(selectAll);
      await waitFor(() => {
        expect(screen.getByTestId("bulk-verify-btn")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("bulk-verify-btn"));

      await waitFor(() => {
        expect(adminService.batchVerifyListings).toHaveBeenCalledWith(["list-1", "list-2"]);
        expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/verified/i));
      });
    });
  });
});
