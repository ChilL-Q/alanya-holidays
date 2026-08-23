import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { render, screen } from "@testing-library/react";
import React from "react";
import { useToast } from "./useToast";

describe("useToast hook", () => {
  it("should initialize with an empty list of toasts", () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it("should add a success toast and return a valid toast ID", () => {
    const { result } = renderHook(() => useToast());

    let toastId: string = "";
    act(() => {
      toastId = result.current.showToast("Saved successfully", "Your changes have been saved", "success");
    });

    expect(toastId).toBeTruthy();
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].id).toBe(toastId);
    expect(result.current.toasts[0].message).toBe("Saved successfully");
    expect(result.current.toasts[0].subMessage).toBe("Your changes have been saved");
    expect(result.current.toasts[0].type).toBe("success");
  });

  it("should support adding info and error toasts", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast("Info message", undefined, "info");
      result.current.showToast("Error message", "Something went wrong", "error", 5000);
    });

    expect(result.current.toasts).toHaveLength(2);
    expect(result.current.toasts[0].type).toBe("info");
    expect(result.current.toasts[1].type).toBe("error");
    expect(result.current.toasts[1].duration).toBe(5000);
  });

  it("should dismiss a toast by ID", () => {
    const { result } = renderHook(() => useToast());

    let id1 = "";
    let id2 = "";
    act(() => {
      id1 = result.current.showToast("Message 1");
      id2 = result.current.showToast("Message 2");
    });

    expect(result.current.toasts).toHaveLength(2);

    act(() => {
      result.current.dismissToast(id1);
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].id).toBe(id2);
  });

  it("should render ToastContainer element when toasts are active", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast("Toast Title", "Sub message");
    });

    const Container = result.current.ToastContainer;
    render(<Container />);

    expect(screen.getByText("Toast Title")).toBeDefined();
    expect(screen.getByText("Sub message")).toBeDefined();
  });
});
