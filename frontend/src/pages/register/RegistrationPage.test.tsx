import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RegistrationPage from "./RegistrationPage";

const signUp = vi.fn();
const signInWithOAuth = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ signUp, signInWithOAuth }),
}));

vi.mock("@/components/base/PageHeroImage", () => ({
  default: () => <div data-testid="hero-image" />,
}));

function Destination() {
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  return <div data-testid="destination">{location.pathname}{from ? `|${from}` : ""}</div>;
}

function renderRegistration(
  variant: "regular" | "business",
  returnPath?: string,
) {
  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: variant === "business" ? "/business/register" : "/register",
          state: returnPath ? { from: { pathname: returnPath } } : null,
        },
      ]}
    >
      <Routes>
        <Route path="/register" element={<RegistrationPage variant="regular" />} />
        <Route path="/business/register" element={<RegistrationPage variant="business" />} />
        <Route path="/login" element={<Destination />} />
        <Route path="*" element={<Destination />} />
      </Routes>
    </MemoryRouter>
  );
}

function completeSharedFields() {
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "  Ada Lovelace  " } });
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: " ada@example.com " } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "password123" } });
  fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "password123" } });
}

describe("RegistrationPage", () => {
  beforeEach(() => {
    signUp.mockReset();
    signInWithOAuth.mockReset();
  });

  it.each([
    ["regular", "Personal account", "Business account"],
    ["business", "Business account", "Personal account"],
  ] as const)(
    "makes the %s registration path explicit and links to the alternative account type",
    (variant, activeLabel, alternativeLabel) => {
      renderRegistration(variant);

      const personalLink = screen.getByRole("link", { name: "Personal account" });
      const businessLink = screen.getByRole("link", { name: "Business account" });

      expect(personalLink).toHaveAttribute("href", "/register");
      expect(businessLink).toHaveAttribute("href", "/business/register");
      expect(screen.getByRole("link", { name: activeLabel })).toHaveAttribute(
        "aria-current",
        "page"
      );
      expect(screen.getByRole("link", { name: alternativeLabel })).not.toHaveAttribute(
        "aria-current"
      );
    }
  );

  it("keeps regular registration metadata business-free and redirects a session to home", async () => {
    signUp.mockResolvedValue({ user: { id: "user-1" }, session: { access_token: "token" }, error: null });
    renderRegistration("regular");

    completeSharedFields();
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => expect(signUp).toHaveBeenCalledTimes(1));
    expect(signUp).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "password123",
      fullName: "Ada Lovelace",
    });
    await waitFor(() => expect(screen.getByTestId("destination")).toHaveTextContent("/"));
  });

  it("returns to the requested page after registration and preserves it for Sign In", async () => {
    signUp.mockResolvedValue({
      user: { id: "user-1" },
      session: { access_token: "token" },
      error: null,
    });
    const firstRender = renderRegistration("regular", "/new-thread");

    const signInLinks = screen.getAllByRole("link", { name: /Sign In/i });
    fireEvent.click(signInLinks[0]);
    expect(screen.getByTestId("destination")).toHaveTextContent("/login|/new-thread");
    firstRender.unmount();

    renderRegistration("regular", "/new-thread");
    completeSharedFields();
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => expect(signUp).toHaveBeenCalledTimes(1));
    expect(signUp).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "password123",
      fullName: "Ada Lovelace",
      emailRedirectTo: `${window.location.origin}/new-thread`,
    });
    await waitFor(() =>
      expect(screen.getByTestId("destination")).toHaveTextContent("/new-thread"),
    );
  });

  it("submits exact non-authoritative business metadata once and redirects a session to the dashboard", async () => {
    signUp.mockResolvedValue({ user: { id: "user-2" }, session: { access_token: "token" }, error: null });
    renderRegistration("business");

    completeSharedFields();
    fireEvent.change(screen.getByLabelText(/business name/i), { target: { value: "  Analytical Engines Ltd  " } });
    fireEvent.change(screen.getByLabelText(/^account type$/i, { selector: "select" }), {
      target: { value: "service_provider" },
    });
    fireEvent.change(screen.getByLabelText(/contact phone/i), { target: { value: "  +90 555 123 4567  " } });
    fireEvent.change(screen.getByLabelText(/website/i), { target: { value: "  https://example.com  " } });
    fireEvent.click(screen.getByRole("button", { name: "Create Business Account" }));

    await waitFor(() => expect(signUp).toHaveBeenCalledTimes(1));
    expect(signUp).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "password123",
      fullName: "Ada Lovelace",
      metadata: {
        registration_path: "business",
        company_name: "Analytical Engines Ltd",
        business_name: "Analytical Engines Ltd",
        account_type: "service_provider",
        contact_email: "ada@example.com",
        contact_phone: "+90 555 123 4567",
        website: "https://example.com",
      },
      emailRedirectTo: `${window.location.origin}/business/dashboard`,
    });
    expect(signUp.mock.calls[0][0].metadata).not.toHaveProperty("role");
    expect(signUp.mock.calls[0][0].metadata).not.toHaveProperty("is_admin");
    expect(signUp.mock.calls[0][0].metadata).not.toHaveProperty("status");
    await waitFor(() =>
      expect(screen.getByTestId("destination")).toHaveTextContent("/business/dashboard")
    );
  });

  it("does not call auth signup when business details violate database constraints", async () => {
    renderRegistration("business");

    completeSharedFields();
    fireEvent.change(screen.getByLabelText(/business name/i), { target: { value: "X" } });
    fireEvent.submit(screen.getByRole("button", { name: "Create Business Account" }).closest("form")!);

    expect(await screen.findByText("Business name must be at least 2 characters.")).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it("shows business confirmation copy and preserves the shared login return destination", async () => {
    signUp.mockResolvedValue({ user: { id: "user-3" }, session: null, error: null });
    renderRegistration("business");

    completeSharedFields();
    fireEvent.change(screen.getByLabelText(/business name/i), { target: { value: "Alanya Services" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Business Account" }));

    expect(await screen.findByText("Confirm your business account email")).toBeInTheDocument();
    const loginLink = screen.getByRole("link", { name: "Go to Sign In" });
    expect(loginLink).toHaveAttribute("href", "/login");
    fireEvent.click(loginLink);
    expect(screen.getByTestId("destination")).toHaveTextContent("/login|/business/dashboard");
  });
});
