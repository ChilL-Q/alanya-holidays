import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CheckoutPage from "./page";
import { ordersService } from "@/api-services/orders.service";

const mockClearCart = vi.fn();
let mockCartItems = [
  {
    id: "prod-1",
    productName: "Luxury Yacht Voucher",
    price: "€350.00",
    quantity: 1,
    icon: "ri-sailboat-line",
  },
];

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
    items: mockCartItems,
    clearCart: mockClearCart,
    totalItems: mockCartItems.length,
  }),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("CheckoutPage Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockClearCart.mockClear();
    mockNavigate.mockClear();
    mockCartItems = [
      {
        id: "prod-1",
        productName: "Luxury Yacht Voucher",
        price: "€350.00",
        quantity: 1,
        icon: "ri-sailboat-line",
      },
    ];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render order summary and form fields when cart has items", () => {
    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Checkout" })).toBeInTheDocument();
    expect(screen.getAllByText("Luxury Yacht Voucher").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Gift Details")).toBeInTheDocument();
    expect(screen.getByLabelText(/Recipient Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Recipient Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Email/i)).toBeInTheDocument();
  });

  it("should redirect to /shop if cart is empty and not completed", () => {
    mockCartItems = [];
    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith("/shop", { replace: true });
  });

  it("should submit order via ordersService.createOrder and show order confirmation", async () => {
    const createOrderSpy = vi.spyOn(ordersService, "createOrder").mockResolvedValueOnce({
      success: true,
      orderId: 98765,
    });

    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );

    const recipientNameInput = screen.getByLabelText(/Recipient Name/i);
    const recipientEmailInput = screen.getByLabelText(/Recipient Email/i);
    const senderNameInput = screen.getByLabelText(/Your Name/i);
    const senderEmailInput = screen.getByLabelText(/Your Email/i);
    const giftMessageInput = screen.getByLabelText(/Gift Message/i);

    fireEvent.change(recipientNameInput, { target: { value: "Selin Yilmaz" } });
    fireEvent.change(recipientEmailInput, { target: { value: "selin@example.com" } });
    fireEvent.change(senderNameInput, { target: { value: "Murat Demir" } });
    fireEvent.change(senderEmailInput, { target: { value: "murat@example.com" } });
    fireEvent.change(giftMessageInput, { target: { value: "Happy Vacation!" } });

    const form = recipientNameInput.closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(createOrderSpy).toHaveBeenCalledWith({
        recipientName: "Selin Yilmaz",
        recipientEmail: "selin@example.com",
        recipientPhone: "+905550000000",
        contactMethod: "email",
        senderName: "Murat Demir",
        senderEmail: "murat@example.com",
        giftMessage: "Happy Vacation!",
        subtotal: 350,
        currency: "EUR",
        items: [
          {
            productId: "prod-1",
            productName: "Luxury Yacht Voucher",
            skuId: undefined,
            skuLabel: undefined,
            quantity: 1,
            price: "€350.00",
            unitPrice: 350,
            finalPrice: 350,
            subtotal: 350,
          },
        ],
      });
    });

    await waitFor(() => {
      expect(mockClearCart).toHaveBeenCalled();
      expect(screen.getByText("Order Confirmed!")).toBeInTheDocument();
      expect(screen.getByText("#98765")).toBeInTheDocument();
    });
  });

  it("should display error message when order creation fails", async () => {
    vi.spyOn(ordersService, "createOrder").mockRejectedValueOnce(
      new Error("Payment service unavailable")
    );

    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );

    const recipientNameInput = screen.getByLabelText(/Recipient Name/i);
    const recipientEmailInput = screen.getByLabelText(/Recipient Email/i);
    const senderNameInput = screen.getByLabelText(/Your Name/i);
    const senderEmailInput = screen.getByLabelText(/Your Email/i);

    fireEvent.change(recipientNameInput, { target: { value: "Selin Yilmaz" } });
    fireEvent.change(recipientEmailInput, { target: { value: "selin@example.com" } });
    fireEvent.change(senderNameInput, { target: { value: "Murat Demir" } });
    fireEvent.change(senderEmailInput, { target: { value: "murat@example.com" } });

    const form = recipientNameInput.closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      const errorElements = screen.getAllByText("Payment service unavailable");
      expect(errorElements.length).toBeGreaterThanOrEqual(1);
    });
  });
});
