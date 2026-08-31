import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "./page";

const signIn = vi.fn();
const signInWithOAuth = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ signIn, signInWithOAuth }),
}));
vi.mock("@/components/base/PageHeroImage", () => ({
  default: () => <div data-testid="hero-image" />,
}));

function renderLogin(returnPath = "/new-thread") {
  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/login",
          state: { from: { pathname: returnPath } },
        },
      ]}
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<div>Auth destination</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LoginPage return path", () => {
  beforeEach(() => {
    signIn.mockReset();
    signInWithOAuth.mockReset();
  });

  it("returns to the requested internal page after password sign in", async () => {
    signIn.mockResolvedValue({ error: null });
    renderLogin();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Sign In$/i }));

    await waitFor(() => expect(screen.getByText("Auth destination")).toBeInTheDocument());
    expect(signIn).toHaveBeenCalledWith("user@example.com", "password123");
  });

  it("passes the requested internal page to OAuth", async () => {
    signInWithOAuth.mockResolvedValue({ error: null });
    renderLogin();

    fireEvent.click(screen.getByRole("button", { name: /Google/i }));

    await waitFor(() =>
      expect(signInWithOAuth).toHaveBeenCalledWith(
        "google",
        `${window.location.origin}/new-thread`,
      ),
    );
  });

  it("rejects protocol-relative return paths", async () => {
    signInWithOAuth.mockResolvedValue({ error: null });
    renderLogin("//example.com/phishing");

    fireEvent.click(screen.getByRole("button", { name: /Google/i }));

    await waitFor(() => expect(signInWithOAuth).toHaveBeenCalledWith("google"));
  });
});
