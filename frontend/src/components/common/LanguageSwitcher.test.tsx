import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LanguageSwitcher from "./LanguageSwitcher";
import "@/i18n";
import i18n from "i18next";

describe("LanguageSwitcher Component", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders with the current default language (English)", () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole("button", { name: /Language selector/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent(/EN/i);
    expect(button).toHaveTextContent(/English/i);
  });

  it("opens language selection menu on click", () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole("button", { name: /Language selector/i });
    fireEvent.click(button);

    expect(screen.getByRole("button", { name: /Русский/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Türkçe/i })).toBeInTheDocument();
  });

  it("switches language when an option is clicked", async () => {
    const handleLanguageChange = vi.fn();
    render(<LanguageSwitcher onLanguageChange={handleLanguageChange} />);

    const button = screen.getByRole("button", { name: /Language selector/i });
    fireEvent.click(button);

    const ruOption = screen.getByRole("button", { name: /Русский/i });
    fireEvent.click(ruOption);

    expect(i18n.language).toBe("ru");
    expect(handleLanguageChange).toHaveBeenCalledWith("ru");
  });

  it("renders compact mode correctly", () => {
    render(<LanguageSwitcher compact={true} />);
    const button = screen.getByRole("button", { name: /Language selector/i });
    expect(button).toHaveTextContent("EN");
  });
});
