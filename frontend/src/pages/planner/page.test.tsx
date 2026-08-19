import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PlannerPage from "./page";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    isAuthenticated: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/hooks/useCart", () => ({
  useCart: () => ({
    items: [],
    totalCount: 0,
    totalPrice: 0,
  }),
}));

const mockCreatePlan = vi.fn();
const mockUpdatePlan = vi.fn();
const mockDeletePlan = vi.fn();
const mockDuplicatePlan = vi.fn();
const mockAddItem = vi.fn();
const mockUpdateItem = vi.fn();
const mockRemoveItem = vi.fn();
const mockReorderItems = vi.fn();
const mockGetPlan = vi.fn();

vi.mock("@/hooks/usePlanner", () => ({
  usePlanner: () => ({
    plans: [
      {
        id: "plan-1",
        name: "3 Days in Alanya",
        description: "Explore beaches and castle",
        items: [
          {
            id: "item-1",
            type: "business",
            referenceId: "biz-001",
            dayLabel: "Day 1",
            timeSlot: "Morning (8AM - 12PM)",
            subcategory: "Dining",
            completed: false,
            order: 1,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    isSyncing: false,
    createPlan: mockCreatePlan,
    updatePlan: mockUpdatePlan,
    deletePlan: mockDeletePlan,
    duplicatePlan: mockDuplicatePlan,
    addItem: mockAddItem,
    updateItem: mockUpdateItem,
    removeItem: mockRemoveItem,
    reorderItems: mockReorderItems,
    getPlan: mockGetPlan,
    getDayLabels: () => ["Day 1"],
  }),
}));

vi.mock("@/hooks/useSharedPlans", () => ({
  useSharedPlans: () => ({
    sharedPlans: [
      {
        shareId: "share-1",
        originalPlanId: "plan-1",
        name: "Alanya Highlights",
        authorName: "Sarah M.",
        description: "Best 3 days tour",
        category: "Adventure",
        copyCount: 15,
        sharedAt: new Date().toISOString(),
        items: [],
      },
    ],
    sharePlan: vi.fn(),
    unsharePlan: vi.fn(),
    incrementCopyCount: vi.fn(),
    isPlanShared: () => false,
  }),
}));

describe("PlannerPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("must not contain nested <button> tags inside another <button> (invalid DOM nesting)", () => {
    const { container } = render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );

    const nestedButtons = container.querySelectorAll("button button");
    expect(nestedButtons.length).toBe(0);
  });

  it("renders header, suggested plans, community templates, and saved itineraries", () => {
    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Plan Your Dream Alanya Holiday/i)).toBeInTheDocument();
    expect(screen.getByText(/Suggested Plans/i)).toBeInTheDocument();
    expect(screen.getByText(/Community Templates/i)).toBeInTheDocument();
    expect(screen.getByText(/3 Days in Alanya/i)).toBeInTheDocument();
  });

  it("opens Create Plan modal when 'Create Custom Plan' is clicked", () => {
    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );

    const createBtn = screen.getByText("Create Custom Plan");
    fireEvent.click(createBtn);

    expect(screen.getByText("Create New Plan")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Weekend in Alanya/i)).toBeInTheDocument();
  });

  it("opens AI Assistant modal when 'AI Trip Planner' is clicked", () => {
    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );

    const aiBtn = screen.getByText("AI Trip Planner");
    fireEvent.click(aiBtn);

    expect(screen.getByText(/Gemini AI Holiday Guide/i)).toBeInTheDocument();
  });
});
