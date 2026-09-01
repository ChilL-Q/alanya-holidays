import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminService, type AdminBookingItem } from "@/api-services/admin.service";
import BookingsAdminTab from "./BookingsAdminTab";

const paidBooking: AdminBookingItem = {
  id: "booking-1",
  item_id: "villa-1",
  item_type: "property",
  check_in: "2026-09-10",
  check_out: "2026-09-12",
  total_price: 500,
  status: "confirmed",
  payment_status: "paid",
  payout_status: "pending",
  itemTitle: "Alanya Test Villa",
};

describe("BookingsAdminTab", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(adminService, "getAdminBookings").mockResolvedValue([paidBooking]);
  });

  it("offers cancellation without claiming that money will be refunded", async () => {
    render(<BookingsAdminTab />);

    expect(await screen.findByText("Alanya Test Villa")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /refund/i })).not.toBeInTheDocument();
  });

  it("shows an actionable error when a booking mutation is unsuccessful", async () => {
    vi.spyOn(adminService, "updateBookingStatus").mockResolvedValueOnce(false);
    render(<BookingsAdminTab />);

    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Booking update failed. Please try again.",
    );
  });
});
