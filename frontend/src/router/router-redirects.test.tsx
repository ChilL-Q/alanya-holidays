import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import routes from "./config";

describe("Router Canonical Redirects", () => {
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
