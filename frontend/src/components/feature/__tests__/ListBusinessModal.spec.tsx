import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ListBusinessModal from "../ListBusinessModal";
import { directoryService } from "@/api-services/directory.service";
import toast from "react-hot-toast";

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ListBusinessModal Component (Milestone M3 / R3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders tier selection step when opened", () => {
    render(<ListBusinessModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/choose your business tier/i)).toBeInTheDocument();
    expect(screen.getByText("Explorer")).toBeInTheDocument();
    expect(screen.getByText("Voyager")).toBeInTheDocument();
    expect(screen.getByText("Signature")).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    render(<ListBusinessModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("adapts form fields dynamically when Free Explorer tier is selected", async () => {
    render(<ListBusinessModal isOpen={true} onClose={vi.fn()} />);

    // Click Explorer (Free) tier
    const explorerSelectBtn = screen.getByTestId("select-tier-explorer");
    fireEvent.click(explorerSelectBtn);

    // Should transition to Step 2 (Form)
    expect(await screen.findByLabelText(/business name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/business description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();

    // Paid tier features should be hidden or locked on Free tier
    expect(screen.queryByLabelText(/instagram url/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/promotional video url/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/instant booking url/i)).not.toBeInTheDocument();
  });

  it("unlocks social links, video URL, and instant booking when Paid tier is selected", async () => {
    render(<ListBusinessModal isOpen={true} onClose={vi.fn()} />);

    // Click Signature (Paid) tier
    const signatureSelectBtn = screen.getByTestId("select-tier-signature");
    fireEvent.click(signatureSelectBtn);

    // Paid tier fields should be accessible
    expect(await screen.findByLabelText(/instagram url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/promotional video url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/instant booking url/i)).toBeInTheDocument();
  });

  it("shows 48-hour review confirmation popup when Free Tier is submitted", async () => {
    const createSpy = vi.spyOn(directoryService, "createListing").mockResolvedValue({
      id: "biz-free-1",
      name: "Alanya Cozy Cafe",
      category: "restaurants-cafes",
      subcategory: "Cafe",
      description: "Cozy neighborhood cafe with fresh coffee.",
      address: "Ataturk Cad. No:10, Alanya",
      phone: "+90 242 511 2233",
      email: "info@cozycafe.test",
      website: "",
      rating: 5,
      reviewCount: 1,
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
      tags: ["Cafe"],
      featured: false,
      priceRange: "$",
      openingHours: "08:00 - 20:00",
      lat: 36.54,
      lng: 31.99,
    });

    render(<ListBusinessModal isOpen={true} onClose={vi.fn()} />);

    // Select Explorer
    fireEvent.click(screen.getByTestId("select-tier-explorer"));

    // Fill form
    fireEvent.change(screen.getByLabelText(/business name/i), {
      target: { value: "Alanya Cozy Cafe" },
    });
    fireEvent.change(screen.getByLabelText(/^category/i), {
      target: { value: "restaurants-cafes" },
    });
    fireEvent.change(screen.getByLabelText(/business description/i), {
      target: { value: "Cozy neighborhood cafe with fresh coffee and pastries." },
    });
    fireEvent.change(screen.getByLabelText(/address/i), {
      target: { value: "Ataturk Cad. No:10, Alanya" },
    });
    fireEvent.change(screen.getByLabelText(/contact phone/i), {
      target: { value: "+90 242 511 2233" },
    });
    fireEvent.change(screen.getByLabelText(/business email/i), {
      target: { value: "info@cozycafe.test" },
    });

    const submitBtn = screen.getByRole("button", { name: /submit listing/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Alanya Cozy Cafe",
          tier: "explorer",
        })
      );
    });

    // Free confirmation message check
    expect(
      await screen.findByText(/our team will review your submission and get back to you within 48 hours/i)
    ).toBeInTheDocument();
  });

  it("shows bank transfer instructions confirmation popup when Paid Tier is submitted", async () => {
    const createSpy = vi.spyOn(directoryService, "createListing").mockResolvedValue({
      id: "biz-paid-1",
      name: "Alanya Grand Luxury Hotel",
      category: "hotels-accommodation",
      subcategory: "5-Star Resort",
      description: "Exclusive luxury beachfront resort.",
      address: "D400 Karayolu No:100, Alanya",
      phone: "+90 242 511 9999",
      email: "reservations@grandluxury.test",
      website: "https://grandluxury.test",
      rating: 5,
      reviewCount: 1,
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
      tags: ["Luxury", "Beachfront"],
      featured: true,
      priceRange: "$$$",
      openingHours: "24/7",
      lat: 36.54,
      lng: 31.99,
    });

    render(<ListBusinessModal isOpen={true} onClose={vi.fn()} />);

    // Select Signature tier
    fireEvent.click(screen.getByTestId("select-tier-signature"));

    // Fill form
    fireEvent.change(screen.getByLabelText(/business name/i), {
      target: { value: "Alanya Grand Luxury Hotel" },
    });
    fireEvent.change(screen.getByLabelText(/^category/i), {
      target: { value: "hotels-accommodation" },
    });
    fireEvent.change(screen.getByLabelText(/business description/i), {
      target: { value: "Exclusive luxury beachfront resort with 5-star amenities." },
    });
    fireEvent.change(screen.getByLabelText(/address/i), {
      target: { value: "D400 Karayolu No:100, Alanya" },
    });
    fireEvent.change(screen.getByLabelText(/contact phone/i), {
      target: { value: "+90 242 511 9999" },
    });
    fireEvent.change(screen.getByLabelText(/business email/i), {
      target: { value: "reservations@grandluxury.test" },
    });

    const submitBtn = screen.getByRole("button", { name: /submit listing/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Alanya Grand Luxury Hotel",
          tier: "signature",
        })
      );
    });

    // Bank transfer popup check
    expect(
      await screen.findByText(/payment details will be sent to your email shortly/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/bank transfer instructions/i)).toBeInTheDocument();
    expect(screen.getByText(/ziraat bankası/i)).toBeInTheDocument();
    expect(screen.getByText(/TR89 0001 0000 1234 5678 9012 34/i)).toBeInTheDocument();
  });

  it("renders Save as Draft button in form step and calls saveDraft with partial data", async () => {
    const saveDraftSpy = vi.spyOn(directoryService, "saveDraft").mockResolvedValue({
      id: "draft-xyz-1",
      name: "Partial Sunset Bar",
      category: "nightlife",
      subcategory: "Bar",
      description: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      rating: 0,
      reviewCount: 0,
      image: "",
      tags: [],
      featured: false,
      priceRange: "$$",
      openingHours: "",
      lat: 0,
      lng: 0,
      status: "draft",
    });

    const onDraftSaved = vi.fn();

    render(
      <ListBusinessModal
        isOpen={true}
        onClose={vi.fn()}
        onDraftSaved={onDraftSaved}
      />
    );

    // Select Explorer
    fireEvent.click(screen.getByTestId("select-tier-explorer"));

    // Fill only name
    fireEvent.change(screen.getByLabelText(/business name/i), {
      target: { value: "Partial Sunset Bar" },
    });

    // Check Save as Draft button
    const saveDraftBtn = screen.getByRole("button", { name: /save as draft/i });
    expect(saveDraftBtn).toBeInTheDocument();

    fireEvent.click(saveDraftBtn);

    await waitFor(() => {
      expect(saveDraftSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Partial Sunset Bar",
          tier: "explorer",
        }),
        undefined
      );
    });

    expect(onDraftSaved).toHaveBeenCalled();
    expect(screen.getByText(/draft saved/i)).toBeInTheDocument();
  });

  it("renders draft recovery banner when unsaved draft is in localStorage and restores draft", async () => {
    const savedDraftData = {
      formData: {
        name: "Restored Coffee House",
        category: "restaurants-cafes",
        description: "Specialty coffee roastery in Alanya center.",
        address: "Iskele Cad. 22",
        tier: "explorer",
      },
      draftId: "cloud-draft-777",
      lastSavedAt: new Date().toISOString(),
    };

    localStorage.setItem("alanya_listing_draft_guest", JSON.stringify(savedDraftData));

    render(<ListBusinessModal isOpen={true} onClose={vi.fn()} />);

    // Select Explorer to see form
    fireEvent.click(screen.getByTestId("select-tier-explorer"));

    // Recovery banner should be visible
    expect(
      await screen.findByText(/unsaved draft found/i)
    ).toBeInTheDocument();

    const resumeBtn = screen.getByRole("button", { name: /resume draft/i });
    fireEvent.click(resumeBtn);

    // Form fields should be populated from draft
    expect((screen.getByLabelText(/business name/i) as HTMLInputElement).value).toBe(
      "Restored Coffee House"
    );
    expect(
      (screen.getByLabelText(/business description/i) as HTMLTextAreaElement).value
    ).toBe("Specialty coffee roastery in Alanya center.");
  });

  it("pre-fills form directly when initialData and draftId are provided as props", async () => {
    const initialData = {
      name: "Existing Draft Boutique",
      category: "shopping",
      description: "Handcrafted souvenirs and jewelry.",
      address: "Bazaar Street No:4",
      phone: "+90 242 555 1234",
      email: "boutique@alanya.test",
      tier: "voyager" as const,
    };

    render(
      <ListBusinessModal
        isOpen={true}
        onClose={vi.fn()}
        draftId="draft-prop-888"
        initialData={initialData}
      />
    );

    // When initialData is provided, it should open directly in form step
    expect(await screen.findByLabelText(/business name/i)).toBeInTheDocument();
    expect((screen.getByLabelText(/business name/i) as HTMLInputElement).value).toBe(
      "Existing Draft Boutique"
    );
    expect(
      (screen.getByLabelText(/business description/i) as HTMLTextAreaElement).value
    ).toBe("Handcrafted souvenirs and jewelry.");
  });

  it("does not delete draft from localStorage and displays error toast when createListing API fails", async () => {
    const createSpy = vi
      .spyOn(directoryService, "createListing")
      .mockRejectedValueOnce(new Error("Network submission failed"));

    const onListingCreated = vi.fn();

    render(
      <ListBusinessModal
        isOpen={true}
        onClose={vi.fn()}
        onListingCreated={onListingCreated}
      />
    );

    // Select Explorer
    fireEvent.click(screen.getByTestId("select-tier-explorer"));

    // Fill form
    fireEvent.change(screen.getByLabelText(/business name/i), {
      target: { value: "Failing Listing Cafe" },
    });
    fireEvent.change(screen.getByLabelText(/^category/i), {
      target: { value: "restaurants-cafes" },
    });
    fireEvent.change(screen.getByLabelText(/business description/i), {
      target: { value: "A wonderful cafe with scenic views." },
    });
    fireEvent.change(screen.getByLabelText(/address/i), {
      target: { value: "Kleopatra Cad. 12" },
    });
    fireEvent.change(screen.getByLabelText(/contact phone/i), {
      target: { value: "+90 242 555 1111" },
    });
    fireEvent.change(screen.getByLabelText(/business email/i), {
      target: { value: "contact@failingcafe.test" },
    });

    const submitBtn = screen.getByRole("button", { name: /submit listing/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalled();
    });

    // Error toast should be triggered
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });

    // Success callback should NOT be called
    expect(onListingCreated).not.toHaveBeenCalled();

    // Should NOT transition to confirmed step
    expect(
      screen.queryByText(/submission confirmation/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/our team will review your submission/i)
    ).not.toBeInTheDocument();

    // Should still be on the form step with data intact
    expect(screen.getByLabelText(/business name/i)).toBeInTheDocument();
    expect(
      (screen.getByLabelText(/business name/i) as HTMLInputElement).value
    ).toBe("Failing Listing Cafe");

    // Submitting state should reset
    expect(screen.getByRole("button", { name: /submit listing/i })).not.toBeDisabled();
  });

  it("does not delete draft and displays error toast when publishDraft API fails", async () => {
    const publishSpy = vi
      .spyOn(directoryService, "publishDraft")
      .mockRejectedValueOnce(new Error("Publishing draft failed on backend"));

    const onListingCreated = vi.fn();

    render(
      <ListBusinessModal
        isOpen={true}
        onClose={vi.fn()}
        onListingCreated={onListingCreated}
        draftId="cloud-draft-999"
        initialData={{
          name: "Cloud Draft Business",
          category: "shopping",
          description: "A cozy shopping center in Alanya.",
          address: "Ataturk Cad. 88",
          phone: "+90 242 555 2222",
          email: "shop@cloud.test",
          tier: "explorer",
        }}
      />
    );

    expect(await screen.findByLabelText(/business name/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /submit listing/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(publishSpy).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });

    expect(onListingCreated).not.toHaveBeenCalled();
    expect(
      screen.queryByText(/submission confirmation/i)
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/business name/i)).toBeInTheDocument();
  });
});
