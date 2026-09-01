import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { forumService, type Category } from "@/api-services/forum.service";
import CategoriesGrid from "./CategoriesGrid";
import i18n from "@/i18n";

const categories: Category[] = [
  {
    id: "travel",
    name: "Travel & Vacation Planning",
    icon: "ri-flight-takeoff-line",
    description: "Travel planning",
    threadCount: 6,
    memberCount: 10,
    subcategories: [],
    color: "from-primary-500 to-primary-700",
    image: "/images/home/alanya_castle.webp",
    slug: "travel-vacation",
  },
  {
    id: "beaches",
    name: "Beaches & Nature",
    icon: "ri-sun-line",
    description: "Beaches",
    threadCount: 5,
    memberCount: 10,
    subcategories: [],
    color: "from-primary-500 to-primary-700",
    image: "/images/categories/nature.webp",
    slug: "beaches-nature",
  },
  {
    id: "food",
    name: "Food & Nightlife",
    icon: "ri-restaurant-line",
    description: "Food",
    threadCount: 5,
    memberCount: 10,
    subcategories: [],
    color: "from-primary-500 to-primary-700",
    image: "/images/home/turkish_cuisine.webp",
    slug: "food-nightlife",
  },
];

describe("CategoriesGrid", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await i18n.changeLanguage("en");
  });

  it("renders a category image in every card style", async () => {
    vi.spyOn(forumService, "getCategories").mockResolvedValue(categories);

    render(
      <MemoryRouter>
        <CategoriesGrid />
      </MemoryRouter>
    );

    expect(await screen.findByRole("img", { name: "Travel & Vacation" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Beaches & Nature" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Food & Nightlife" })).toBeInTheDocument();
  });

  it("keeps the image clearly visible on dark category cards", async () => {
    vi.spyOn(forumService, "getCategories").mockResolvedValue(categories);

    render(
      <MemoryRouter>
        <CategoriesGrid />
      </MemoryRouter>
    );

    const image = await screen.findByRole("img", {
      name: "Travel & Vacation",
    });

    expect(image).toHaveClass("opacity-100");
    expect(image.nextElementSibling).toHaveClass("from-black/60", "to-black/10");
  });

  it("localizes known category labels and count nouns in Russian", async () => {
    await i18n.changeLanguage("ru");
    vi.spyOn(forumService, "getCategories").mockResolvedValue(categories);

    render(
      <MemoryRouter>
        <CategoriesGrid />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Путешествия и отдых" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Пляжи и природа" })).toBeInTheDocument();
    expect(screen.getByText("6 обсуждений")).toBeInTheDocument();
    expect(screen.getAllByText("0 тем")).toHaveLength(2);
    expect(screen.queryByText("6 discussions")).not.toBeInTheDocument();
  });
});
