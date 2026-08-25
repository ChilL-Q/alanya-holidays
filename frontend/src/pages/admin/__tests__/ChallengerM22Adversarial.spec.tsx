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

describe("Challenger M2.2: Adversarial Stress Test for Directory Curation Controls", () => {
  const mockListings: ModerationListing[] = [
    {
      id: "item-alpha",
      name: "Alanya Grand Yachting",
      slug: "alanya-grand-yachting",
      category_id: "boat-tours",
      category: "Boat & Yacht Charters",
      status: "approved",
      tier: "signature",
      location: "Alanya Marina",
      is_featured: false,
      is_verified: false,
      base_score: 75,
      created_at: "2026-08-20T10:00:00Z",
    },
    {
      id: "item-beta",
      name: "Taurus Mountain Paragliding",
      slug: "taurus-mountain-paragliding",
      category_id: "activities",
      category: "Activities & Tours",
      status: "approved",
      tier: "partner",
      location: "Taurus Peaks",
      is_featured: true,
      is_verified: true,
      base_score: 95,
      created_at: "2026-08-20T11:00:00Z",
    },
    {
      id: "item-gamma",
      name: "Kleopatra Beach Lounge",
      slug: "kleopatra-beach-lounge",
      category_id: "restaurants",
      category: "Restaurants & Dining",
      status: "pending",
      tier: "explorer",
      location: "Kleopatra Beach",
      is_featured: false,
      is_verified: false,
      base_score: 0,
      created_at: "2026-08-20T12:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.spyOn(adminService, "getModerationListings").mockResolvedValue(
      JSON.parse(JSON.stringify(mockListings))
    );
    vi.spyOn(adminService, "featureListing").mockResolvedValue(true);
    vi.spyOn(adminService, "unfeatureListing").mockResolvedValue(true);
    vi.spyOn(adminService, "verifyListing").mockResolvedValue(true);
    vi.spyOn(adminService, "unverifyListing").mockResolvedValue(true);
    vi.spyOn(adminService, "updateListingScore").mockResolvedValue(true);
    vi.spyOn(adminService, "batchFeatureListings").mockResolvedValue({
      successful: ["item-alpha", "item-beta", "item-gamma"],
      failed: [],
    });
    vi.spyOn(adminService, "batchVerifyListings").mockResolvedValue({
      successful: ["item-alpha", "item-beta", "item-gamma"],
      failed: [],
    });
  });

  describe("1. Rapid Clicking & In-Flight Request Concurrency", () => {
    it("prevents duplicate concurrent API requests and handles rapid star clicks gracefully", async () => {
      let resolveApi: (val: boolean) => void;
      const delayedFeaturePromise = new Promise<boolean>((resolve) => {
        resolveApi = resolve;
      });

      vi.spyOn(adminService, "featureListing").mockImplementation(() => delayedFeaturePromise);

      render(<ListingsModerationTab />);

      await waitFor(() => {
        expect(screen.getByText("Alanya Grand Yachting")).toBeInTheDocument();
      });

      const starToggle = screen.getByTestId("feature-toggle-item-alpha");
      expect(starToggle).not.toBeDisabled();

      // First click initiates in-flight request
      fireEvent.click(starToggle);

      // Button is now disabled while in flight
      expect(starToggle).toBeDisabled();

      // Attempt rapid second and third clicks
      fireEvent.click(starToggle);
      fireEvent.click(starToggle);

      // API must only be called ONCE
      expect(adminService.featureListing).toHaveBeenCalledTimes(1);
      expect(adminService.featureListing).toHaveBeenCalledWith("item-alpha");

      // Resolve in-flight request
      resolveApi!(true);

      await waitFor(() => {
        expect(starToggle).not.toBeDisabled();
        expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/featured/i));
      });
    });

    it("prevents duplicate concurrent API requests for verified checkmark toggles", async () => {
      let resolveVerify: (val: boolean) => void;
      const delayedVerifyPromise = new Promise<boolean>((resolve) => {
        resolveVerify = resolve;
      });

      vi.spyOn(adminService, "verifyListing").mockImplementation(() => delayedVerifyPromise);

      render(<ListingsModerationTab />);

      await waitFor(() => {
        expect(screen.getByText("Alanya Grand Yachting")).toBeInTheDocument();
      });

      const verifyToggle = screen.getByTestId("verify-toggle-item-alpha");
      expect(verifyToggle).not.toBeDisabled();

      // First click
      fireEvent.click(verifyToggle);
      expect(verifyToggle).toBeDisabled();

      // Rapid clicks
      fireEvent.click(verifyToggle);
      fireEvent.click(verifyToggle);

      expect(adminService.verifyListing).toHaveBeenCalledTimes(1);

      resolveVerify!(true);

      await waitFor(() => {
        expect(verifyToggle).not.toBeDisabled();
        expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/verified/i));
      });
    });
  });

  describe("2. Network Failure & State Rollback Simulation", () => {
    it("rolls back optimistic star toggle when API throws network rejection", async () => {
      vi.spyOn(adminService, "featureListing").mockRejectedValueOnce(
        new Error("Network connection lost (500)")
      );

      render(<ListingsModerationTab />);

      await waitFor(() => {
        expect(screen.getByText("Alanya Grand Yachting")).toBeInTheDocument();
      });

      const starToggle = screen.getByTestId("feature-toggle-item-alpha");
      expect(starToggle.querySelector(".ri-star-line")).toBeInTheDocument();

      // Click to feature
      fireEvent.click(starToggle);

      // Verify rollback after network error
      await waitFor(() => {
        expect(adminService.featureListing).toHaveBeenCalledWith("item-alpha");
        expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/network error/i));
        // Must be rolled back to unfeatured outline
        expect(starToggle.querySelector(".ri-star-line")).toBeInTheDocument();
      });
    });

    it("rolls back optimistic verify toggle when API returns false", async () => {
      vi.spyOn(adminService, "unverifyListing").mockResolvedValueOnce(false);

      render(<ListingsModerationTab />);

      await waitFor(() => {
        expect(screen.getByText("Taurus Mountain Paragliding")).toBeInTheDocument();
      });

      // item-beta is initially verified
      const verifyToggle = screen.getByTestId("verify-toggle-item-beta");
      expect(
        verifyToggle.querySelector(".ri-checkbox-circle-fill, .ri-verified-badge-fill")
      ).toBeInTheDocument();

      // Click to unverify
      fireEvent.click(verifyToggle);

      await waitFor(() => {
        expect(adminService.unverifyListing).toHaveBeenCalledWith("item-beta");
        expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/failed to update/i));
        // Must be rolled back to verified icon
        expect(
          verifyToggle.querySelector(".ri-checkbox-circle-fill, .ri-verified-badge-fill")
        ).toBeInTheDocument();
      });
    });

    it("rolls back optimistic score update when API throws error", async () => {
      vi.spyOn(window, "prompt").mockReturnValueOnce("88");
      vi.spyOn(adminService, "updateListingScore").mockRejectedValueOnce(
        new Error("Server error 500")
      );

      render(<ListingsModerationTab />);

      await waitFor(() => {
        expect(screen.getByText("Alanya Grand Yachting")).toBeInTheDocument();
      });

      const scoreBtn = screen.getByTestId("score-btn-item-alpha");
      expect(scoreBtn).toHaveTextContent("75");

      fireEvent.click(scoreBtn);

      await waitFor(() => {
        expect(adminService.updateListingScore).toHaveBeenCalledWith("item-alpha", 88);
        expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/network error/i));
        // Reverted to original 75
        expect(scoreBtn).toHaveTextContent("75");
      });
    });
  });

  describe("3. Score Editor Boundary Values & Input Validation", () => {
    it("accepts lower boundary score 0", async () => {
      vi.spyOn(window, "prompt").mockReturnValueOnce("0");

      render(<ListingsModerationTab />);
      await waitFor(() => expect(screen.getByText("Alanya Grand Yachting")).toBeInTheDocument());

      const scoreBtn = screen.getByTestId("score-btn-item-alpha");
      fireEvent.click(scoreBtn);

      await waitFor(() => {
        expect(adminService.updateListingScore).toHaveBeenCalledWith("item-alpha", 0);
        expect(toast.success).toHaveBeenCalledWith("Score updated to 0");
        expect(scoreBtn).toHaveTextContent("0");
      });
    });

    it("accepts upper boundary score 100", async () => {
      vi.spyOn(window, "prompt").mockReturnValueOnce("100");

      render(<ListingsModerationTab />);
      await waitFor(() => expect(screen.getByText("Alanya Grand Yachting")).toBeInTheDocument());

      const scoreBtn = screen.getByTestId("score-btn-item-alpha");
      fireEvent.click(scoreBtn);

      await waitFor(() => {
        expect(adminService.updateListingScore).toHaveBeenCalledWith("item-alpha", 100);
        expect(toast.success).toHaveBeenCalledWith("Score updated to 100");
        expect(scoreBtn).toHaveTextContent("100");
      });
    });

    it("rejects negative score (< 0) with error toast and no API call", async () => {
      vi.spyOn(window, "prompt").mockReturnValueOnce("-5");

      render(<ListingsModerationTab />);
      await waitFor(() => expect(screen.getByText("Alanya Grand Yachting")).toBeInTheDocument());

      const scoreBtn = screen.getByTestId("score-btn-item-alpha");
      fireEvent.click(scoreBtn);

      await waitFor(() => {
        expect(adminService.updateListingScore).not.toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith(
          "Score must be a number between 0 and 100"
        );
        expect(scoreBtn).toHaveTextContent("75");
      });
    });

    it("rejects score exceeding 100 (> 100) with error toast and no API call", async () => {
      vi.spyOn(window, "prompt").mockReturnValueOnce("101");

      render(<ListingsModerationTab />);
      await waitFor(() => expect(screen.getByText("Alanya Grand Yachting")).toBeInTheDocument());

      const scoreBtn = screen.getByTestId("score-btn-item-alpha");
      fireEvent.click(scoreBtn);

      await waitFor(() => {
        expect(adminService.updateListingScore).not.toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith(
          "Score must be a number between 0 and 100"
        );
        expect(scoreBtn).toHaveTextContent("75");
      });
    });

    it("rejects non-numeric score with error toast and no API call", async () => {
      vi.spyOn(window, "prompt").mockReturnValueOnce("invalid_score_abc");

      render(<ListingsModerationTab />);
      await waitFor(() => expect(screen.getByText("Alanya Grand Yachting")).toBeInTheDocument());

      const scoreBtn = screen.getByTestId("score-btn-item-alpha");
      fireEvent.click(scoreBtn);

      await waitFor(() => {
        expect(adminService.updateListingScore).not.toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith(
          "Score must be a number between 0 and 100"
        );
        expect(scoreBtn).toHaveTextContent("75");
      });
    });

    it("gracefully cancels prompt when user presses cancel/escape (prompt returns null)", async () => {
      vi.spyOn(window, "prompt").mockReturnValueOnce(null);

      render(<ListingsModerationTab />);
      await waitFor(() => expect(screen.getByText("Alanya Grand Yachting")).toBeInTheDocument());

      const scoreBtn = screen.getByTestId("score-btn-item-alpha");
      fireEvent.click(scoreBtn);

      await waitFor(() => {
        expect(adminService.updateListingScore).not.toHaveBeenCalled();
        expect(toast.error).not.toHaveBeenCalled();
        expect(toast.success).not.toHaveBeenCalled();
        expect(scoreBtn).toHaveTextContent("75");
      });
    });

    it("gracefully ignores empty string prompt submission", async () => {
      vi.spyOn(window, "prompt").mockReturnValueOnce("   ");

      render(<ListingsModerationTab />);
      await waitFor(() => expect(screen.getByText("Alanya Grand Yachting")).toBeInTheDocument());

      const scoreBtn = screen.getByTestId("score-btn-item-alpha");
      fireEvent.click(scoreBtn);

      await waitFor(() => {
        expect(adminService.updateListingScore).not.toHaveBeenCalled();
        expect(toast.error).not.toHaveBeenCalled();
        expect(scoreBtn).toHaveTextContent("75");
      });
    });
  });

  describe("4. Bulk Action Toolbar State & Selection Dynamics", () => {
    it("remains hidden on empty selection (0 selected)", async () => {
      render(<ListingsModerationTab />);
      await waitFor(() => expect(screen.getByText("Alanya Grand Yachting")).toBeInTheDocument());

      expect(screen.queryByTestId("bulk-actions-toolbar")).not.toBeInTheDocument();
    });

    it("handles partial selection (1 of 3) and allows expanding to full selection via toolbar", async () => {
      render(<ListingsModerationTab />);
      await waitFor(() => expect(screen.getByText("Alanya Grand Yachting")).toBeInTheDocument());

      // Select 1 item
      const selectAlpha = screen.getByLabelText(/Select Alanya Grand Yachting/i);
      fireEvent.click(selectAlpha);

      await waitFor(() => {
        const toolbar = screen.getByTestId("bulk-actions-toolbar");
        expect(toolbar).toBeInTheDocument();
        expect(toolbar).toHaveTextContent(/1.*of.*3.*listings selected/i);
        expect(screen.getByRole("button", { name: /Select All \(3\)/i })).toBeInTheDocument();
      });

      // Expand to Select All via toolbar button
      const selectAllBtn = screen.getByRole("button", { name: /Select All \(3\)/i });
      fireEvent.click(selectAllBtn);

      await waitFor(() => {
        const toolbar = screen.getByTestId("bulk-actions-toolbar");
        expect(toolbar).toHaveTextContent(/3.*of.*3.*listings selected/i);
        expect(screen.getByRole("button", { name: /Deselect All/i })).toBeInTheDocument();
      });
    });

    it("handles deselecting all items via clear button", async () => {
      render(<ListingsModerationTab />);
      await waitFor(() => expect(screen.getByText("Alanya Grand Yachting")).toBeInTheDocument());

      // Select header checkbox (Select All)
      const selectAllHeader = screen.getByLabelText(/Select all listings/i);
      fireEvent.click(selectAllHeader);

      await waitFor(() => {
        expect(screen.getByTestId("bulk-actions-toolbar")).toBeInTheDocument();
      });

      // Click clear selection button
      const clearBtn = screen.getByLabelText(/Clear Selection/i);
      fireEvent.click(clearBtn);

      await waitFor(() => {
        expect(screen.queryByTestId("bulk-actions-toolbar")).not.toBeInTheDocument();
      });
    });

    it("executes bulk feature and bulk verify on selected subsets correctly", async () => {
      render(<ListingsModerationTab />);
      await waitFor(() => expect(screen.getByText("Alanya Grand Yachting")).toBeInTheDocument());

      // Select Alpha and Gamma (2 of 3)
      fireEvent.click(screen.getByLabelText(/Select Alanya Grand Yachting/i));
      fireEvent.click(screen.getByLabelText(/Select Kleopatra Beach Lounge/i));

      await waitFor(() => {
        expect(screen.getByTestId("bulk-actions-toolbar")).toHaveTextContent(/2.*of.*3.*selected/i);
      });

      // Bulk Feature
      const bulkFeatureBtn = screen.getByTestId("bulk-feature-btn");
      fireEvent.click(bulkFeatureBtn);

      await waitFor(() => {
        expect(adminService.batchFeatureListings).toHaveBeenCalledWith([
          "item-alpha",
          "item-gamma",
        ]);
        expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/batch featured 3/i));
        // Selection cleared after bulk action
        expect(screen.queryByTestId("bulk-actions-toolbar")).not.toBeInTheDocument();
      });

      // Select again and do Bulk Verify
      fireEvent.click(screen.getByLabelText(/Select Alanya Grand Yachting/i));
      await waitFor(() => expect(screen.getByTestId("bulk-verify-btn")).toBeInTheDocument());

      fireEvent.click(screen.getByTestId("bulk-verify-btn"));

      await waitFor(() => {
        expect(adminService.batchVerifyListings).toHaveBeenCalledWith(["item-alpha"]);
        expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/batch verified 3/i));
      });
    });
  });
});
