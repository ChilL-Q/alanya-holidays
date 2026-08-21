import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import WhatsAppFloatingButton from "./WhatsAppFloatingButton";

describe("WhatsAppFloatingButton Component", () => {
  it("renders with correct WhatsApp concierge link and URL-encoded message", () => {
    render(<WhatsAppFloatingButton />);
    const link = screen.getByRole("link", { name: /chat on whatsapp/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "https://wa.me/14389294208?text=Hi%20Alanya%20Holidays!%20I%20have%20a%20question%20about%20your%20experiences."
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows tooltip text on hover and hides on mouse leave", () => {
    render(<WhatsAppFloatingButton />);
    const link = screen.getByRole("link", { name: /chat on whatsapp/i });
    const tooltipText = screen.getByText(/Chat with us on WhatsApp/i);

    expect(tooltipText.parentElement).toHaveClass("opacity-0");
    expect(tooltipText.parentElement).toHaveClass("translate-x-2");

    fireEvent.mouseEnter(link);
    expect(tooltipText.parentElement).toHaveClass("opacity-100");
    expect(tooltipText.parentElement).toHaveClass("translate-x-0");

    fireEvent.mouseLeave(link);
    expect(tooltipText.parentElement).toHaveClass("opacity-0");
    expect(tooltipText.parentElement).toHaveClass("translate-x-2");
  });

  it("renders with horizontal layout to avoid overlapping stacked controls", () => {
    const { container } = render(<WhatsAppFloatingButton />);
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv).toHaveClass("flex");
    expect(rootDiv).toHaveClass("items-center");
    expect(rootDiv).not.toHaveClass("flex-col");
  });

  it("has accessible dark mode, smooth micro-interactions, and pulse ring styling classes", () => {
    render(<WhatsAppFloatingButton />);
    const link = screen.getByRole("link", { name: /chat on whatsapp/i });
    const pulseRing = link.querySelector(".animate-ping");
    expect(pulseRing).toBeInTheDocument();
    expect(link).toHaveClass("ease-out");
    expect(link).toHaveClass("hover:-translate-y-0.5");
    expect(link).not.toHaveClass("hover:scale-110");
  });
});
