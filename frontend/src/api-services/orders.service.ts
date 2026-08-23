import { apiClient } from "@/lib/api-client";
import { Money } from "@/domain/money.vo";
import { logger } from "@/lib/logger";

export interface OrderItem {
  productName: string;
  quantity: number;
  price?: string | number;
  icon?: string;
  productId?: string | number;
  skuId?: string | number | null;
  skuLabel?: string | null;
  unitPrice?: number;
  finalPrice?: number;
  subtotal?: number;
}

export interface OrderRecipient {
  name: string;
  email: string;
  phone?: string;
  contact_method?: "whatsapp" | "phone_call" | "email";
}

export interface CreateOrderPayload {
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  contactMethod?: "whatsapp" | "phone_call" | "email";
  senderName?: string;
  senderEmail?: string;
  giftMessage?: string;
  customerNotes?: string;
  subtotal: number;
  currency?: string;
  items: OrderItem[];
  recipient?: OrderRecipient;
}

export interface CreateOrderResult {
  success: boolean;
  orderId: number | string;
  message?: string;
}

export interface OrderDetailsResponse {
  id: number | string;
  status?: string;
  currency?: string;
  subtotal?: number;
  total_price?: number;
  recipient_name?: string;
  recipient_email?: string;
  sender_name?: string;
  sender_email?: string;
  gift_message?: string;
  items?: Array<OrderItem | Record<string, unknown>>;
  created_at?: string;
  [key: string]: unknown;
}

export class OrdersService {
  /**
   * Creates a checkout gift or product order.
   * Dispatches POST /products/orders via apiClient.
   */
  async createOrder(payload: CreateOrderPayload): Promise<CreateOrderResult> {
    const currency = payload.currency || "EUR";

    const recipient: OrderRecipient = payload.recipient || {
      name: payload.recipientName || "Guest",
      email: payload.recipientEmail || "guest@example.com",
      phone: payload.recipientPhone,
      contact_method: (payload.contactMethod || "email") as
        | "whatsapp"
        | "phone_call"
        | "email",
    };

    const notes =
      payload.customerNotes ||
      (payload.giftMessage
        ? `From: ${payload.senderName || ""} (${payload.senderEmail || ""}) - Message: ${payload.giftMessage}`
        : null);

    const items = payload.items.map((item, index) => {
      let unitPrice = item.unitPrice;
      if (unitPrice === undefined) {
        if (typeof item.price === "number") {
          unitPrice = item.price;
        } else if (typeof item.price === "string") {
          unitPrice = Money.parse(item.price, currency).toDatabaseDecimal();
        } else {
          unitPrice = 0;
        }
      }
      const finalPrice =
        item.finalPrice !== undefined ? item.finalPrice : unitPrice;
      const subtotal =
        item.subtotal !== undefined
          ? item.subtotal
          : Money.fromDecimal(finalPrice, currency)
              .multiply(item.quantity)
              .toDatabaseDecimal();

      return {
        productId:
          item.productId !== undefined && item.productId !== null
            ? item.productId
            : `item-${index + 1}`,
        productName: item.productName,
        skuId: item.skuId != null ? item.skuId : null,
        skuLabel: item.skuLabel || null,
        quantity: item.quantity,
        unitPrice,
        finalPrice,
        subtotal,
      };
    });

    const body = {
      currency,
      subtotal: payload.subtotal,
      customerNotes: notes,
      recipient,
      items,
    };

    const result = await apiClient.post<{
      id?: number | string;
      order_id?: number | string;
      orderId?: number | string;
      success?: boolean;
      message?: string;
    }>("/products/orders", body);

    return {
      success: result.success ?? true,
      orderId: result.orderId ?? result.id ?? result.order_id ?? Date.now(),
      message: result.message,
    };
  }

  /**
   * Retrieves order details by ID.
   * Dispatches GET /products/orders/:id via apiClient.
   */
  async getOrder(
    orderId: number | string,
  ): Promise<OrderDetailsResponse | null> {
    try {
      const result = await apiClient.get<OrderDetailsResponse>(
        `/products/orders/${orderId}`,
      );
      if (
        result &&
        (result.id !== undefined || result.order_id !== undefined)
      ) {
        return result;
      }
      return result || null;
    } catch (err: unknown) {
      logger.warn(`Failed to fetch order ${orderId} from API:`, err);
      return null;
    }
  }

  /**
   * Retrieves all orders for the current authenticated user.
   * Dispatches GET /products/orders/my-orders via apiClient.
   */
  async getMyOrders(): Promise<OrderDetailsResponse[]> {
    try {
      const response = await apiClient.get<
        OrderDetailsResponse[] | { data: OrderDetailsResponse[] }
      >("/products/orders/my-orders");

      if (Array.isArray(response)) {
        return response;
      }
      if (
        response &&
        typeof response === "object" &&
        "data" in response &&
        Array.isArray(response.data)
      ) {
        return response.data;
      }
      return [];
    } catch (err: unknown) {
      logger.warn("Failed to fetch my orders from API:", err);
      return [];
    }
  }
}

export const ordersService = new OrdersService();

export const createOrder = (payload: CreateOrderPayload) =>
  ordersService.createOrder(payload);

export const getOrder = (orderId: number | string) =>
  ordersService.getOrder(orderId);

export const getMyOrders = () => ordersService.getMyOrders();
