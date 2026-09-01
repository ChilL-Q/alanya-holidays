import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CheckoutPage from "./page";
import { ordersService } from "@/api-services/orders.service";
import i18n from "@/i18n";

vi.mock("@/api-services/orders.service", () => ({
  ordersService: {
    createOrder: vi.fn(),
  },
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    showToast: vi.fn(),
    ToastContainer: () => null,
  }),
}));

vi.mock("@/pages/home/components/Navbar", () => ({ default: () => <nav /> }));
vi.mock("@/pages/home/components/Footer", () => ({ default: () => <footer /> }));
vi.mock("@/components/base/PageHeroImage", () => ({ default: () => null }));

const mockClearCart = vi.fn();
type MockCartItem = {
  id: string;
  productName: string;
  price: string;
  quantity: number;
  icon: string;
  imageUrl?: string;
};

let mockCartItems: MockCartItem[] = [
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
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
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

  afterEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("en");
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
    expect(screen.getByLabelText(/Recipient Phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Email/i)).toBeInTheDocument();
  });

  it("should render a product image in the order summary when available", () => {
    mockCartItems[0].imageUrl = "https://example.com/yacht-voucher.jpg";

    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("img", { name: "Luxury Yacht Voucher" }),
    ).toHaveAttribute("src", "https://example.com/yacht-voucher.jpg");
  });

  it("shows an actionable empty-cart state instead of silently redirecting", () => {
    mockCartItems = [];
    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Your cart is empty" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse the shop" })).toHaveAttribute("href", "/shop");
  });

  it("localizes checkout labels and actions in Russian", async () => {
    await i18n.changeLanguage("ru");

    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );

    expect(screen.getByLabelText("Имя получателя *")).toBeInTheDocument();
    expect(screen.getByLabelText("Email получателя *")).toBeInTheDocument();
    expect(screen.getByLabelText("Телефон получателя *")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Отправить подарок — 350.00 EUR" })).toBeInTheDocument();
    expect(screen.queryByText("Back to Shop")).not.toBeInTheDocument();
  });

  it("should submit order via ordersService.createOrder and show order confirmation", async () => {
    const createOrderSpy = vi.mocked(ordersService.createOrder).mockResolvedValueOnce({
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
    const recipientPhoneInput = screen.getByLabelText(/Recipient Phone/i);
    const senderNameInput = screen.getByLabelText(/Your Name/i);
    const senderEmailInput = screen.getByLabelText(/Your Email/i);
    const giftMessageInput = screen.getByLabelText(/Gift Message/i);

    fireEvent.change(recipientNameInput, { target: { value: "Selin Yilmaz" } });
    fireEvent.change(recipientEmailInput, { target: { value: "selin@example.com" } });
    fireEvent.change(recipientPhoneInput, { target: { value: "+905551234567" } });
    fireEvent.change(senderNameInput, { target: { value: "Murat Demir" } });
    fireEvent.change(senderEmailInput, { target: { value: "murat@example.com" } });
    fireEvent.change(giftMessageInput, { target: { value: "Happy Vacation!" } });

    const form = recipientNameInput.closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(createOrderSpy).toHaveBeenCalledWith({
        recipientName: "Selin Yilmaz",
        recipientEmail: "selin@example.com",
        recipientPhone: "+905551234567",
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
      expect(screen.getByText("Your order #98765 has been placed successfully.")).toBeInTheDocument();
    });
  });

  it("should display error message when order creation fails", async () => {
    vi.mocked(ordersService.createOrder).mockRejectedValueOnce(
      new Error("Payment service unavailable")
    );

    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );

    const recipientNameInput = screen.getByLabelText(/Recipient Name/i);
    const recipientEmailInput = screen.getByLabelText(/Recipient Email/i);
    const recipientPhoneInput = screen.getByLabelText(/Recipient Phone/i);
    const senderNameInput = screen.getByLabelText(/Your Name/i);
    const senderEmailInput = screen.getByLabelText(/Your Email/i);

    fireEvent.change(recipientNameInput, { target: { value: "Selin Yilmaz" } });
    fireEvent.change(recipientEmailInput, { target: { value: "selin@example.com" } });
    fireEvent.change(recipientPhoneInput, { target: { value: "+905551234567" } });
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
