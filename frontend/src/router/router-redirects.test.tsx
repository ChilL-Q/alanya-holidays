import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import routes from "./config";

describe("Router Canonical Redirects", () => {
  it("declares business registration before the dynamic business detail route", () => {
    const registerIndex = routes.findIndex((route) => route.path === "/business/register");
    const detailIndex = routes.findIndex((route) => route.path === "/business/:businessId");

    expect(registerIndex).toBeGreaterThan(-1);
    expect(detailIndex).toBeGreaterThan(registerIndex);
  });
  it("redirects /forum to /categories", async () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ["/forum"],
    });

    render(<RouterProvider router={router} />);
    expect(router.state.location.pathname).toBe("/categories");
  });

  it("redirects /directory to /explore", async () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ["/directory"],
    });

    render(<RouterProvider router={router} />);
    expect(router.state.location.pathname).toBe("/explore");
  });
});
