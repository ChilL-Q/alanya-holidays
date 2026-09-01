import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import WhatsAppFloatingButton from "./WhatsAppFloatingButton";
import i18n from "@/i18n";

const renderButton = (path = "/") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <WhatsAppFloatingButton />
    </MemoryRouter>,
  );

describe("WhatsAppFloatingButton Component", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await i18n.changeLanguage("en");
  });

  it("renders with correct WhatsApp concierge link and URL-encoded message", () => {
    renderButton();
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
    renderButton();
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
    const { container } = renderButton();
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv).toHaveClass("flex");
    expect(rootDiv).toHaveClass("items-center");
    expect(rootDiv).not.toHaveClass("flex-col");
  });

  it("has accessible dark mode, smooth micro-interactions, and pulse ring styling classes", () => {
    renderButton();
    const link = screen.getByRole("link", { name: /chat on whatsapp/i });
    const pulseRing = link.querySelector(".animate-ping");
    expect(pulseRing).toBeInTheDocument();
    expect(link).toHaveClass("ease-out");
    expect(link).toHaveClass("hover:-translate-y-0.5");
    expect(link).not.toHaveClass("hover:scale-110");
  });

  it("localizes the accessible label, tooltip, and prefilled message", async () => {
    await i18n.changeLanguage("ru");
    renderButton();

    const link = screen.getByRole("link", { name: "Написать в WhatsApp" });
    expect(screen.getByText("Свяжитесь с нами в WhatsApp")).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "https://wa.me/14389294208?text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5%2C%20Alanya%20Holidays!%20%D0%A3%20%D0%BC%D0%B5%D0%BD%D1%8F%20%D0%B5%D1%81%D1%82%D1%8C%20%D0%B2%D0%BE%D0%BF%D1%80%D0%BE%D1%81%20%D0%BE%20%D0%B2%D0%B0%D1%88%D0%B8%D1%85%20%D0%B2%D0%BF%D0%B5%D1%87%D0%B0%D1%82%D0%BB%D0%B5%D0%BD%D0%B8%D1%8F%D1%85.",
    );
  });

  it.each(["/login", "/register", "/checkout", "/admin"])(
    "does not render on the protected form surface %s",
    (path) => {
      renderButton(path);
      expect(screen.queryByRole("link", { name: /WhatsApp/i })).not.toBeInTheDocument();
    },
  );

  it("uses safe-area-aware offsets", () => {
    const { container } = renderButton();
    expect(container.firstChild).toHaveClass(
      "bottom-[calc(1rem+env(safe-area-inset-bottom))]",
      "right-[calc(1rem+env(safe-area-inset-right))]",
    );
  });

  it.each([
    ["form", <form aria-label="Booking form" key="form" />],
    ["call to action", <aside data-floating-cta="true" key="cta" />],
    ["cart drawer", <aside data-floating-ui-obstruction="true" key="cart" />],
    ["modal", <div role="dialog" aria-modal="true" key="modal" />],
    ["footer", <footer key="footer" />],
  ])("hides while a visible %s could be covered", async (_surface, obstruction) => {
    class VisibleIntersectionObserver implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = "0px";
      readonly thresholds = [0];

      constructor(private readonly callback: IntersectionObserverCallback) {}

      observe(target: Element) {
        this.callback(
          [
            {
              boundingClientRect: target.getBoundingClientRect(),
              intersectionRatio: 1,
              intersectionRect: target.getBoundingClientRect(),
              isIntersecting: true,
              rootBounds: null,
              target,
              time: 0,
            },
          ],
          this,
        );
      }

      disconnect() {}
      takeRecords() { return []; }
      unobserve() {}
    }

    vi.stubGlobal("IntersectionObserver", VisibleIntersectionObserver);
    render(
      <MemoryRouter>
        {obstruction}
        <WhatsAppFloatingButton />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "Chat on WhatsApp" })).not.toBeInTheDocument();
    });
  });
});
