import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import NewThreadPage from "./page";

const authState = vi.hoisted(() => ({
  user: null as { id: string } | null,
  loading: false,
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => authState,
}));
vi.mock("./components/NewThreadHero", () => ({ default: () => <header /> }));
vi.mock("./components/ThreadForm", () => ({
  default: () => <div>Thread form</div>,
}));

function RegistrationDestination() {
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  return <div>Register destination: {from}</div>;
}

describe("NewThreadPage", () => {
  beforeEach(() => {
    authState.user = null;
    authState.loading = false;
  });

  it("redirects guests to registration and preserves the new-thread destination", async () => {
    render(
      <MemoryRouter initialEntries={["/new-thread"]}>
        <Routes>
          <Route path="/new-thread" element={<NewThreadPage />} />
          <Route path="/register" element={<RegistrationDestination />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByText("Register destination: /new-thread")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Thread form")).not.toBeInTheDocument();
  });

  it("renders the thread form for authenticated users", () => {
    authState.user = { id: "user-1" };

    render(
      <MemoryRouter initialEntries={["/new-thread"]}>
        <NewThreadPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Thread form")).toBeInTheDocument();
  });
});
