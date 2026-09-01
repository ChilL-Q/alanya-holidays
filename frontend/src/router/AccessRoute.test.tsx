import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AccessRoute from "./AccessRoute";

const mockUseAuth = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

function LoginProbe() {
  const location = useLocation();
  const from = location.state?.from as { pathname?: string; search?: string } | undefined;
  return <div>Login page from {`${from?.pathname ?? ""}${from?.search ?? ""}`}</div>;
}

function renderAccessRoute(level: "authenticated" | "host" | "admin" = "admin") {
  return render(
    <MemoryRouter initialEntries={["/admin?tab=claims"]}>
      <Routes>
        <Route path="/" element={<div>Public home</div>} />
        <Route path="/login" element={<LoginProbe />} />
        <Route
          path="/admin"
          element={
            <AccessRoute level={level}>
              <div>Protected dashboard</div>
            </AccessRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AccessRoute", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it("does not render protected content while authentication is loading", () => {
    mockUseAuth.mockReturnValue({
      loading: true,
      isAuthenticated: false,
      isHost: false,
      isAdmin: false,
    });

    renderAccessRoute();

    expect(screen.queryByText("Protected dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Public home")).not.toBeInTheDocument();
  });

  it("redirects a guest to login and preserves the requested location", () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: false,
      isHost: false,
      isAdmin: false,
    });

    renderAccessRoute();

    expect(screen.getByText("Login page from /admin?tab=claims")).toBeInTheDocument();
    expect(screen.queryByText("Protected dashboard")).not.toBeInTheDocument();
  });

  it("redirects an authenticated non-admin away from the admin route", () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
      isHost: false,
      isAdmin: false,
    });

    renderAccessRoute();

    expect(screen.getByText("Public home")).toBeInTheDocument();
    expect(screen.queryByText("Protected dashboard")).not.toBeInTheDocument();
  });

  it("renders the admin route for an administrator", () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
      isHost: true,
      isAdmin: true,
    });

    renderAccessRoute();

    expect(screen.getByText("Protected dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Public home")).not.toBeInTheDocument();
  });

  it("allows any signed-in user through an authenticated route", () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
      isHost: false,
      isAdmin: false,
    });

    renderAccessRoute("authenticated");

    expect(screen.getByText("Protected dashboard")).toBeInTheDocument();
  });

  it("allows hosts through a host route and rejects regular users", () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
      isHost: true,
      isAdmin: false,
    });
    const { unmount } = renderAccessRoute("host");
    expect(screen.getByText("Protected dashboard")).toBeInTheDocument();
    unmount();

    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
      isHost: false,
      isAdmin: false,
    });
    renderAccessRoute("host");
    expect(screen.getByText("Public home")).toBeInTheDocument();
  });
});
