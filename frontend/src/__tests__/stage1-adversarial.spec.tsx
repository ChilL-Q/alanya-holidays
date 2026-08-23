import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import BusinessCard from "@/pages/explore/components/BusinessCard";
import ListBusinessModal from "@/components/feature/ListBusinessModal";
import ClaimListingModal from "@/components/feature/ClaimListingModal";
import { directoryService } from "@/api-services/directory.service";
import type { Business } from "@/mocks/businesses";

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      <BrowserRouter>{ui}</BrowserRouter>
    </AuthProvider>
  );
}

describe("Tier 5: Adversarial & Stress Testing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles XSS payloads safely without script execution or crash in BusinessCard", () => {
    const xssBusiness: Business = {
      id: "biz-xss-1",
      name: "<script>alert('xss')</script><b>Dangerous Bistro</b>",
      category: "restaurants-cafes",
      subcategory: "<img src=x onerror=alert(1)>",
      description: `"><svg onload=alert(document.cookie)>`,
      address: "<iframe src='javascript:alert(1)'></iframe>",
      phone: "+90 000 000 0000",
      email: "xss@danger.test",
      website: "javascript:alert(1)",
      rating: 5.0,
      reviewCount: 999,
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
      tags: ["<script>", "<img>", "normal-tag"],
      featured: true,
      priceRange: "$$$",
      openingHours: "24/7",
      lat: 36.5,
      lng: 31.9,
    };

    renderWithProviders(<BusinessCard business={xssBusiness} />);

    // React escapes text content safely into the DOM text nodes
    expect(screen.getByText(/Dangerous Bistro/i)).toBeInTheDocument();
  });

  it("handles rapid duplicate submit clicks gracefully in ListBusinessModal", async () => {
    const createSpy = vi.spyOn(directoryService, "createListing").mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({} as Business), 100))
    );

    renderWithProviders(<ListBusinessModal isOpen={true} onClose={vi.fn()} />);

    fireEvent.click(screen.getByTestId("select-tier-explorer"));
    fireEvent.change(screen.getByLabelText(/business name/i), { target: { value: "Concurrency Test Cafe" } });
    fireEvent.change(screen.getByLabelText(/^category/i), { target: { value: "restaurants-cafes" } });
    fireEvent.change(screen.getByLabelText(/business description/i), { target: { value: "Concurrency testing." } });
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: "Address 123" } });
    fireEvent.change(screen.getByLabelText(/contact phone/i), { target: { value: "+90 532 000 0000" } });
    fireEvent.change(screen.getByLabelText(/business email/i), { target: { value: "test@concurrency.test" } });

    const submitBtn = screen.getByRole("button", { name: /submit listing/i });

    // Rapid double click
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1);
    });
  });

  it("handles backend 500 error gracefully without crashing ClaimListingModal", async () => {
    vi.spyOn(directoryService, "submitClaim").mockRejectedValue(new Error("Server 500 Internal Error"));

    const sampleBiz: Business = {
      id: "biz-err-1",
      name: "Fallback Test Spot",
      category: "restaurants-cafes",
      subcategory: "Test",
      description: "Test description.",
      address: "Test Address",
      phone: "+90 555 123 4567",
      email: "test@error.test",
      website: "https://test.test",
      rating: 4.5,
      reviewCount: 10,
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
      tags: ["Test"],
      featured: false,
      priceRange: "$$",
      openingHours: "09:00 - 18:00",
      lat: 36.5,
      lng: 31.9,
    };

    renderWithProviders(<ClaimListingModal business={sampleBiz} isOpen={true} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/your full name/i), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText(/official business email/i), { target: { value: "user@test.test" } });
    fireEvent.change(screen.getByLabelText(/contact phone/i), { target: { value: "+90 555 123 4567" } });
    fireEvent.click(screen.getByLabelText(/i confirm that i am an authorized representative/i));

    fireEvent.click(screen.getByRole("button", { name: /submit claim/i }));

    // User gets error feedback banner instead of false success confirmation
    expect(await screen.findByText(/Server 500 Internal Error/i)).toBeInTheDocument();
    expect(screen.queryByText(/claim request submitted/i)).not.toBeInTheDocument();
  });
});
