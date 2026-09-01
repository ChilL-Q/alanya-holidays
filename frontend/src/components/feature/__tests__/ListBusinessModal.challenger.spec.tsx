import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ListBusinessModal from "../ListBusinessModal";
import { directoryService } from "@/api-services/directory.service";

describe("Adversarial Empirical Verification: ListBusinessModal Component", () => {
  const guestStorageKey = "alanya_listing_draft_guest";

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("1. Corrupted localStorage & Fault Resilience", () => {
    it("renders modal smoothly without crashing when localStorage contains malformed JSON", () => {
      localStorage.setItem(guestStorageKey, "{ broken: JSON syntax [[");

      render(<ListBusinessModal isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText(/choose your business tier/i)).toBeInTheDocument();
      expect(screen.getByTestId("select-tier-explorer")).toBeInTheDocument();
    });
  });

  describe("2. Save as Draft Action & Partial Incomplete Data", () => {
    it("permits saving incomplete drafts with missing required fields without triggering form validation blocks", async () => {
      const saveDraftSpy = vi.spyOn(directoryService, "saveDraft").mockResolvedValue({
        id: "partial-draft-123",
        name: "Only The Name Provided",
        category: "restaurants",
        description: "",
        address: "",
        phone: "",
        email: "",
        status: "draft",
      } as any);

      const onDraftSaved = vi.fn();

      render(
        <ListBusinessModal
          isOpen={true}
          onClose={vi.fn()}
          onDraftSaved={onDraftSaved}
        />
      );

      // Transition to Form step
      fireEvent.click(screen.getByTestId("select-tier-explorer"));

      // Enter only business name, leaving email, phone, address, and description empty
      fireEvent.change(screen.getByLabelText(/business name/i), {
        target: { value: "Only The Name Provided" },
      });

      // No validation errors should be displayed yet
      expect(screen.queryByText(/business email is required/i)).not.toBeInTheDocument();

      // Click "Save as Draft"
      const saveDraftBtn = screen.getByRole("button", { name: /save as draft/i });
      fireEvent.click(saveDraftBtn);

      await waitFor(() => {
        expect(saveDraftSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Only The Name Provided",
            tier: "explorer",
          }),
          undefined
        );
      });

      // Validation errors should still NOT be triggered for partial draft save
      expect(screen.queryByText(/business email is required/i)).not.toBeInTheDocument();
      expect(onDraftSaved).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Only The Name Provided" }),
        "partial-draft-123"
      );
      expect(await screen.findByText(/draft saved successfully/i)).toBeInTheDocument();
    });

    it("falls back gracefully to local save notification if cloud API save fails", async () => {
      vi.spyOn(directoryService, "saveDraft").mockRejectedValueOnce(
        new Error("Network connection lost")
      );

      const onDraftSaved = vi.fn();

      render(
        <ListBusinessModal
          isOpen={true}
          onClose={vi.fn()}
          onDraftSaved={onDraftSaved}
        />
      );

      fireEvent.click(screen.getByTestId("select-tier-explorer"));

      fireEvent.change(screen.getByLabelText(/business name/i), {
        target: { value: "Local Only Draft" },
      });

      const saveDraftBtn = screen.getByRole("button", { name: /save as draft/i });
      fireEvent.click(saveDraftBtn);

      expect(await screen.findByText(/draft saved locally on this device/i)).toBeInTheDocument();
      expect(onDraftSaved).toHaveBeenCalled();
    });
  });

  describe("3. Draft Recovery & Discard Flows", () => {
    it("displays recovery banner when local draft exists, and resume restores all fields", async () => {
      const storedPayload = {
        formData: {
          name: "Mediterranean Grill & Bar",
          category: "restaurants",
          subcategory: "Steakhouse",
          description: "Prime steaks and sea views.",
          address: "Ataturk Caddesi 45",
          phone: "+90 242 512 3456",
          email: "grill@alanya.test",
          tier: "explorer",
        },
        draftId: "cloud-draft-789",
        lastSavedAt: new Date().toISOString(),
      };

      localStorage.setItem(guestStorageKey, JSON.stringify(storedPayload));

      render(<ListBusinessModal isOpen={true} onClose={vi.fn()} />);

      // Select tier to see form
      fireEvent.click(screen.getByTestId("select-tier-explorer"));

      // Check recovery banner
      expect(await screen.findByText(/unsaved draft found/i)).toBeInTheDocument();
      expect(screen.getByText(/Mediterranean Grill & Bar/i)).toBeInTheDocument();

      // Click "Resume Draft"
      fireEvent.click(screen.getByRole("button", { name: /resume draft/i }));

      // Verify fields restored
      expect((screen.getByLabelText(/business name/i) as HTMLInputElement).value).toBe(
        "Mediterranean Grill & Bar"
      );
      expect(
        (screen.getByLabelText(/business description/i) as HTMLTextAreaElement).value
      ).toBe("Prime steaks and sea views.");
      expect((screen.getByLabelText(/address/i) as HTMLInputElement).value).toBe(
        "Ataturk Caddesi 45"
      );
      expect((screen.getByLabelText(/contact phone/i) as HTMLInputElement).value).toBe(
        "+90 242 512 3456"
      );
      expect((screen.getByLabelText(/business email/i) as HTMLInputElement).value).toBe(
        "grill@alanya.test"
      );

      // Recovery banner disappears after restore
      expect(screen.queryByText(/unsaved draft found/i)).not.toBeInTheDocument();
    });

    it("clicking Discard deletes the stored draft from localStorage and dismisses banner", async () => {
      const storedPayload = {
        formData: {
          name: "Old Abandoned Draft",
          category: "restaurants",
        },
        lastSavedAt: new Date().toISOString(),
      };

      localStorage.setItem(guestStorageKey, JSON.stringify(storedPayload));

      render(<ListBusinessModal isOpen={true} onClose={vi.fn()} />);
      fireEvent.click(screen.getByTestId("select-tier-explorer"));

      expect(await screen.findByText(/unsaved draft found/i)).toBeInTheDocument();

      const discardBtn = screen.getByRole("button", { name: /discard/i });
      fireEvent.click(discardBtn);

      // Storage removed
      expect(localStorage.getItem(guestStorageKey)).toBeNull();
      // Banner gone
      expect(screen.queryByText(/unsaved draft found/i)).not.toBeInTheDocument();
      // Form remains clean default
      expect((screen.getByLabelText(/business name/i) as HTMLInputElement).value).toBe("");
    });

    it("does not create a phantom unsaved draft banner when user merely selects a tier without entering data", async () => {
      // 1. User opens modal and selects Explorer tier without typing anything
      const { unmount } = render(<ListBusinessModal isOpen={true} onClose={vi.fn()} />);
      fireEvent.click(screen.getByTestId("select-tier-explorer"));

      // Wait 600ms for debounce timer to fire
      await new Promise((r) => setTimeout(r, 600));

      unmount();

      // 2. User re-opens modal later
      render(<ListBusinessModal isOpen={true} onClose={vi.fn()} />);
      fireEvent.click(screen.getByTestId("select-tier-explorer"));

      // Should NOT show a phantom recovery banner for an empty draft!
      expect(screen.queryByText(/unsaved draft found/i)).not.toBeInTheDocument();
    });
  });

  describe("4. Post-Submission Draft Purging & Invariant Safety", () => {
    it("purges draft from localStorage upon successful listing creation", async () => {
      const storedPayload = {
        formData: {
          name: "Ready To Submit Business",
          category: "nightlife",
        },
        lastSavedAt: new Date().toISOString(),
      };
      localStorage.setItem(guestStorageKey, JSON.stringify(storedPayload));

      const createSpy = vi.spyOn(directoryService, "createListing").mockResolvedValue({
        id: "new-pub-id-1",
        name: "Ready To Submit Business",
        category: "nightlife",
        description: "Great nightclub by the harbor.",
        address: "Harbor Street 1",
        phone: "+90 242 000 1111",
        email: "club@alanya.test",
        status: "pending",
      } as any);

      const onListingCreated = vi.fn();

      render(
        <ListBusinessModal
          isOpen={true}
          onClose={vi.fn()}
          onListingCreated={onListingCreated}
        />
      );

      fireEvent.click(screen.getByTestId("select-tier-explorer"));

      // Resume draft
      fireEvent.click(await screen.findByRole("button", { name: /resume draft/i }));

      // Complete required fields
      fireEvent.change(screen.getByLabelText(/business description/i), {
        target: { value: "Great nightclub by the harbor." },
      });
      fireEvent.change(screen.getByLabelText(/address/i), {
        target: { value: "Harbor Street 1" },
      });
      fireEvent.change(screen.getByLabelText(/contact phone/i), {
        target: { value: "+90 242 000 1111" },
      });
      fireEvent.change(screen.getByLabelText(/business email/i), {
        target: { value: "club@alanya.test" },
      });

      // Submit listing
      fireEvent.click(screen.getByRole("button", { name: /submit listing/i }));

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalled();
      });

      // UI confirmed step reached
      expect(
        await screen.findByRole("heading", { name: /thank you for listing your business/i })
      ).toBeInTheDocument();
      expect(onListingCreated).toHaveBeenCalled();

      // Wait 600ms past debounce window to verify no phantom resurrect occurs
      await new Promise((r) => setTimeout(r, 600));
      expect(localStorage.getItem(guestStorageKey)).toBeNull();
    });

    it("publishes existing cloud draft via publishDraft and purges draft on success", async () => {
      const publishSpy = vi.spyOn(directoryService, "publishDraft").mockResolvedValue({
        id: "existing-draft-id-555",
        name: "Exquisite Spa Center",
        category: "wellness",
        description: "Authentic Turkish hamam and luxury massages.",
        address: "Kleopatra Beach 10",
        phone: "+90 242 555 7777",
        email: "spa@alanya.test",
        status: "pending",
      } as any);

      render(
        <ListBusinessModal
          isOpen={true}
          onClose={vi.fn()}
          draftId="existing-draft-id-555"
          initialData={{
            name: "Exquisite Spa Center",
            category: "wellness",
            description: "Authentic Turkish hamam and luxury massages.",
            address: "Kleopatra Beach 10",
            phone: "+90 242 555 7777",
            email: "spa@alanya.test",
            tier: "explorer",
          }}
        />
      );

      // Direct to form step
      expect(await screen.findByLabelText(/business name/i)).toBeInTheDocument();

      // Submit
      fireEvent.click(screen.getByRole("button", { name: /submit listing/i }));

      await waitFor(() => {
        expect(publishSpy).toHaveBeenCalledWith(
          "existing-draft-id-555",
          expect.objectContaining({
            name: "Exquisite Spa Center",
            category: "wellness",
          })
        );
      });

      expect(
        await screen.findByRole("heading", { name: /thank you for listing your business/i })
      ).toBeInTheDocument();

      // Wait 600ms past debounce window
      await new Promise((r) => setTimeout(r, 600));
      expect(localStorage.getItem(guestStorageKey)).toBeNull();
    });
  });

  describe("5. Form State Preservation across Tier Changes", () => {
    it("preserves typed core data when navigating back to change tiers", async () => {
      render(<ListBusinessModal isOpen={true} onClose={vi.fn()} />);

      // Choose Explorer
      fireEvent.click(screen.getByTestId("select-tier-explorer"));

      // Type data
      fireEvent.change(screen.getByLabelText(/business name/i), {
        target: { value: "Preserved Sunset Lounge" },
      });
      fireEvent.change(screen.getByLabelText(/business description/i), {
        target: { value: "Sunset drinks and dining." },
      });

      // Click "Change Tier"
      fireEvent.click(screen.getByRole("button", { name: /change tier/i }));

      // Tier picker is visible again
      expect(screen.getByText(/choose your business tier/i)).toBeInTheDocument();

      // Select Voyager tier
      fireEvent.click(screen.getByTestId("select-tier-voyager"));

      // Form step returned: check that typed values are preserved
      expect((screen.getByLabelText(/business name/i) as HTMLInputElement).value).toBe(
        "Preserved Sunset Lounge"
      );
      expect(
        (screen.getByLabelText(/business description/i) as HTMLTextAreaElement).value
      ).toBe("Sunset drinks and dining.");

      // Paid features are now unlocked
      expect(screen.getByLabelText(/instagram url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/promotional video url/i)).toBeInTheDocument();
    });
  });
});
