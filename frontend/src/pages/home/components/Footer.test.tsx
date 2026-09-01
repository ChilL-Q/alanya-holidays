import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Footer from "./Footer";
import i18n from "@/i18n";

describe("Footer", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("does not publish generic social-network homepages as company accounts", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    expect(document.querySelector('a[href="https://instagram.com"]')).not.toBeInTheDocument();
    expect(document.querySelector('a[href="https://facebook.com"]')).not.toBeInTheDocument();
    expect(document.querySelector('a[href="https://twitter.com"]')).not.toBeInTheDocument();
  });

  it("localizes the copyright text without translating the company name", async () => {
    await i18n.changeLanguage("ru");
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    expect(screen.getByText("© 2026 Alanya Holidays. Все права защищены.")).toBeInTheDocument();
    expect(screen.queryByText(/All rights reserved/)).not.toBeInTheDocument();
  });
});
