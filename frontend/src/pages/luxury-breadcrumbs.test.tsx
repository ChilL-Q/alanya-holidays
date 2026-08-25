import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import GolfVacationsPage from "./golf-vacations/page";
import HammamSpaPage from "./hammam-spa/page";
import HelicopterToursPage from "./helicopter-tours/page";
import PersonalChefsPage from "./personal-chefs/page";
import PersonalDriverPage from "./personal-driver/page";
import PersonalShopperPage from "./personal-shopper/page";
import PhotographyExcursionsPage from "./photography-excursions/page";
import PrivateJetsPage from "./private-jets/page";
import VillaStaysPage from "./villa-stays/page";
import WineTastingsPage from "./wine-tastings/page";
import YachtChartersPage from "./yacht-charters/page";

vi.mock("@/pages/home/components/Navbar", () => ({
  default: () => <div data-testid="navbar" />,
}));
vi.mock("@/pages/home/components/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));
vi.mock("@/components/feature/RelatedExperiences", () => ({
  default: () => <div data-testid="related-experiences" />,
}));

const luxuryPages = [
  { name: "GolfVacationsPage", Component: GolfVacationsPage },
  { name: "HammamSpaPage", Component: HammamSpaPage },
  { name: "HelicopterToursPage", Component: HelicopterToursPage },
  { name: "PersonalChefsPage", Component: PersonalChefsPage },
  { name: "PersonalDriverPage", Component: PersonalDriverPage },
  { name: "PersonalShopperPage", Component: PersonalShopperPage },
  { name: "PhotographyExcursionsPage", Component: PhotographyExcursionsPage },
  { name: "PrivateJetsPage", Component: PrivateJetsPage },
  { name: "VillaStaysPage", Component: VillaStaysPage },
  { name: "WineTastingsPage", Component: WineTastingsPage },
  { name: "YachtChartersPage", Component: YachtChartersPage },
];

describe("Luxury Pages Breadcrumbs", () => {
  luxuryPages.forEach(({ name, Component }) => {
    it(`${name} links breadcrumb to /explore instead of /luxury-experience`, () => {
      const { container } = render(
        <MemoryRouter>
          <Component />
        </MemoryRouter>
      );

      const luxuryExpLink = container.querySelector('a[href="/luxury-experience"]');
      expect(luxuryExpLink).toBeNull();

      const exploreLink = container.querySelector('a[href="/explore"]');
      expect(exploreLink).not.toBeNull();
      expect(exploreLink?.textContent).toContain("Explore");
    });
  });
});
