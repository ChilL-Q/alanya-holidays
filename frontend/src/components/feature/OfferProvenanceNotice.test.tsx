import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import i18n from "@/i18n";
import OfferProvenanceNotice from "./OfferProvenanceNotice";

describe("OfferProvenanceNotice", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it.each([
    [
      "ru",
      "Показаны только одобренные объявления. Наличие и точная стоимость подтверждаются после запроса.",
    ],
    [
      "tr",
      "Yalnızca onaylanmış ilanlar gösterilir. Uygunluk ve kesin fiyatlandırma talepten sonra teyit edilir.",
    ],
  ])("renders the exact public provenance notice in %s", async (language, copy) => {
    await i18n.changeLanguage(language);
    render(<OfferProvenanceNotice />);

    expect(screen.getByRole("note")).toHaveTextContent(copy);
  });
});
