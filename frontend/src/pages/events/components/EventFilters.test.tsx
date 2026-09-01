import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import EventFilters from "./EventFilters";
import i18n from "@/i18n";

function StatefulEventFilters() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showFeatured, setShowFeatured] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  return (
    <EventFilters
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      showFeatured={showFeatured}
      onFeaturedToggle={setShowFeatured}
      showSaved={showSaved}
      onSavedToggle={setShowSaved}
    />
  );
}

describe("EventFilters", () => {
  it("exposes grouped controls with accessible toggle states", () => {
    render(<StatefulEventFilters />);

    expect(screen.getByRole("group", { name: "Event categories" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Quick event filters" })).toBeInTheDocument();

    const allEventsButton = screen.getByRole("button", { name: "Show all event categories" });
    const beachCategoryButton = screen.getByRole("button", { name: "Filter events by Beach Gatherings" });
    const savedButton = screen.getByRole("button", { name: "Show only saved events" });
    const featuredButton = screen.getByRole("button", { name: "Show only featured events" });

    expect(allEventsButton).toHaveAttribute("aria-pressed", "true");
    expect(beachCategoryButton).toHaveAttribute("aria-pressed", "false");
    expect(savedButton).toHaveAttribute("aria-pressed", "false");
    expect(featuredButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(beachCategoryButton);
    expect(allEventsButton).toHaveAttribute("aria-pressed", "false");
    expect(beachCategoryButton).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(savedButton);
    fireEvent.click(featuredButton);
    expect(savedButton).toHaveAttribute("aria-pressed", "true");
    expect(featuredButton).toHaveAttribute("aria-pressed", "true");
  });

  it("calls the provided handlers with the expected next values", () => {
    const onCategoryChange = vi.fn();
    const onSavedToggle = vi.fn();
    const onFeaturedToggle = vi.fn();

    render(
      <EventFilters
        activeCategory={"Beach Gatherings"}
        onCategoryChange={onCategoryChange}
        showFeatured={true}
        onFeaturedToggle={onFeaturedToggle}
        showSaved={false}
        onSavedToggle={onSavedToggle}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Filter events by Beach Gatherings" }));
    fireEvent.click(screen.getByRole("button", { name: "Show only saved events" }));
    fireEvent.click(screen.getByRole("button", { name: "Show only featured events" }));

    expect(onCategoryChange).toHaveBeenCalledWith(null);
    expect(onSavedToggle).toHaveBeenCalledWith(true);
    expect(onFeaturedToggle).toHaveBeenCalledWith(false);
  });

  it("localizes known category labels without changing the category value", async () => {
    await i18n.changeLanguage("ru");
    const onCategoryChange = vi.fn();
    render(
      <EventFilters
        activeCategory={null}
        onCategoryChange={onCategoryChange}
        showFeatured={false}
        onFeaturedToggle={vi.fn()}
        showSaved={false}
        onSavedToggle={vi.fn()}
      />,
    );

    const beachButton = screen.getByRole("button", {
      name: "Фильтр мероприятий: Встречи на пляже",
    });
    expect(beachButton).toHaveTextContent("Встречи на пляже");
    fireEvent.click(beachButton);
    expect(onCategoryChange).toHaveBeenCalledWith("Beach Gatherings");
    await i18n.changeLanguage("en");
  });
});
