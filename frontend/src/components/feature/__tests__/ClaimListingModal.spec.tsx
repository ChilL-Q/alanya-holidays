import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ClaimListingModal from "../ClaimListingModal";
import { directoryService } from "@/api-services/directory.service";
import type { Business } from "@/mocks/businesses";
import toast from "react-hot-toast";

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockBusiness: Business = {
  id: "biz-claim-1",
  name: "Alanya Harbor Seafood",
  category: "restaurants",
  subcategory: "Seafood & Grill",
  description: "Fresh Mediterranean seafood by the historic Red Tower.",
  address: "Iskele Cad. No:15, Alanya",
  phone: "+90 242 513 1122",
  email: "owner@alanya-harbor.test",
  website: "https://alanya-harbor.test",
  rating: 4.7,
  reviewCount: 88,
  image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
  tags: ["Seafood", "Harbor View"],
  featured: false,
  priceRange: "$$",
  openingHours: "11:00 - 23:00",
  lat: 36.538,
  lng: 31.999,
};

describe("ClaimListingModal Component (Milestone M4 / R4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders pre-filled business data when open", () => {
    render(
      <ClaimListingModal
        business={mockBusiness}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/claim listing/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Alanya Harbor Seafood")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Iskele Cad. No:15, Alanya")).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    render(
      <ClaimListingModal
        business={mockBusiness}
        isOpen={false}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("validates required claimant fields before submitting", async () => {
    render(
      <ClaimListingModal
        business={mockBusiness}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /submit claim/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/claimant name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/valid official email is required/i)).toBeInTheDocument();
  });

  it("successfully submits claim and renders confirmation state", async () => {
    const submitSpy = vi.spyOn(directoryService, "submitClaim").mockResolvedValue({
      id: "claim-123",
      status: "pending",
    });

    const handleSubmitted = vi.fn();

    render(
      <ClaimListingModal
        business={mockBusiness}
        isOpen={true}
        onClose={vi.fn()}
        onClaimSubmitted={handleSubmitted}
      />
    );

    fireEvent.change(screen.getByLabelText(/your full name/i), {
      target: { value: "Ahmet Yilmaz" },
    });
    fireEvent.change(screen.getByLabelText(/official business email/i), {
      target: { value: "owner@alanya-harbor.test" },
    });
    fireEvent.change(screen.getByLabelText(/contact phone/i), {
      target: { value: "+90 532 000 1122" },
    });
    fireEvent.change(screen.getByLabelText(/your role/i), {
      target: { value: "Owner" },
    });

    const agreeCheckbox = screen.getByLabelText(/i confirm that i am an authorized representative/i);
    fireEvent.click(agreeCheckbox);

    const submitBtn = screen.getByRole("button", { name: /submit claim/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          listing_id: "biz-claim-1",
          business_name: "Alanya Harbor Seafood",
          claimant_name: "Ahmet Yilmaz",
          email: "owner@alanya-harbor.test",
          contact_phone: "+90 532 000 1122",
          role: "Owner",
        })
      );
    });

    expect(await screen.findByText(/claim request submitted/i)).toBeInTheDocument();
    expect(screen.getByText(/we have received your ownership claim/i)).toBeInTheDocument();
  });

  it("displays error feedback, calls toast.error, does not set submitted state, and does not call onClaimSubmitted when API fails", async () => {
    const submitSpy = vi
      .spyOn(directoryService, "submitClaim")
      .mockRejectedValueOnce(new Error("Listing has already been claimed"));

    const handleSubmitted = vi.fn();

    render(
      <ClaimListingModal
        business={mockBusiness}
        isOpen={true}
        onClose={vi.fn()}
        onClaimSubmitted={handleSubmitted}
      />
    );

    fireEvent.change(screen.getByLabelText(/your full name/i), {
      target: { value: "Mehmet Demir" },
    });
    fireEvent.change(screen.getByLabelText(/official business email/i), {
      target: { value: "mehmet@demirseafood.test" },
    });
    fireEvent.change(screen.getByLabelText(/contact phone/i), {
      target: { value: "+90 532 111 2233" },
    });
    fireEvent.change(screen.getByLabelText(/your role/i), {
      target: { value: "General Manager" },
    });

    const agreeCheckbox = screen.getByLabelText(
      /i confirm that i am an authorized representative/i
    );
    fireEvent.click(agreeCheckbox);

    const submitBtn = screen.getByRole("button", { name: /submit claim/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalled();
    });

    // Error toast must be called
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });

    // Callback must NOT be called
    expect(handleSubmitted).not.toHaveBeenCalled();

    // Success screen must NOT be displayed
    expect(screen.queryByText(/claim request submitted/i)).not.toBeInTheDocument();

    // Error UI banner must display error message
    expect(await screen.findByText(/listing has already been claimed/i)).toBeInTheDocument();

    // Submit button should be enabled again (isSubmitting = false)
    expect(screen.getByRole("button", { name: /submit claim/i })).not.toBeDisabled();
  });
});
