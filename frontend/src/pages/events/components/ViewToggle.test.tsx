import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ViewToggle from "./ViewToggle";

function StatefulViewToggle() {
  const [mode, setMode] = useState<"list" | "map">("list");
  return <ViewToggle mode={mode} onChange={setMode} />;
}

describe("ViewToggle", () => {
  it("exposes the view mode switch as an accessible button group", () => {
    render(<StatefulViewToggle />);

    expect(screen.getByRole("group", { name: "Event view mode" })).toBeInTheDocument();

    const listButton = screen.getByRole("button", { name: "Show events as a list" });
    const mapButton = screen.getByRole("button", { name: "Show events on a map" });

    expect(listButton).toHaveAttribute("aria-pressed", "true");
    expect(mapButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(mapButton);

    expect(listButton).toHaveAttribute("aria-pressed", "false");
    expect(mapButton).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onChange with the selected mode", () => {
    const onChange = vi.fn();

    render(<ViewToggle mode="list" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Show events on a map" }));
    fireEvent.click(screen.getByRole("button", { name: "Show events as a list" }));

    expect(onChange).toHaveBeenNthCalledWith(1, "map");
    expect(onChange).toHaveBeenNthCalledWith(2, "list");
  });
});
