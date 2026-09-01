import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import UpgradesAddonsShowcase from "../UpgradesAddonsShowcase";

describe("UpgradesAddonsShowcase Component (Milestone M5 / R6)", () => {
  it("renders all 5 upsell add-on cards with pricing and benefits", () => {
    render(<UpgradesAddonsShowcase />);

    expect(screen.getByText(/upgrades & add-ons/i)).toBeInTheDocument();
    expect(screen.getByText("Instant Booking Integration")).toBeInTheDocument();
    expect(screen.getByText("Verified Traveller Trust Badge")).toBeInTheDocument();
    expect(screen.getByText("Seasonal Campaign Placements")).toBeInTheDocument();
    expect(screen.getByText("Sponsored Editorial Articles")).toBeInTheDocument();
    expect(screen.getByText("AI Translation & Localization")).toBeInTheDocument();

    expect(screen.getByText("€29/mo")).toBeInTheDocument();
    expect(screen.getByText("€15/mo")).toBeInTheDocument();
    expect(screen.getByText("€49/campaign")).toBeInTheDocument();
    expect(screen.getByText("€79/article")).toBeInTheDocument();
    expect(screen.getByText("€19/mo")).toBeInTheDocument();
  });

  it("handles add-on selection and upgrade trigger action", () => {
    const handleUpgrade = vi.fn();
    render(<UpgradesAddonsShowcase onUpgradeSelect={handleUpgrade} />);

    const bookingCardBtn = screen.getByTestId("addon-select-instant-booking");
    fireEvent.click(bookingCardBtn);

    expect(handleUpgrade).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "instant-booking",
        name: "Instant Booking Integration",
        price: "€29/mo",
      })
    );
  });
});
