import { z } from "zod";

export const checkoutSchema = z.object({
  recipientName: z.string().trim().min(1, "Please enter the recipient's name."),
  recipientEmail: z.string().trim().min(1, "Please enter the recipient's email address.").email("Please enter a valid email address."),
  recipientPhone: z.string().trim().min(1, "Please enter the recipient's phone number.").min(6, "Valid phone number is required"),
  senderName: z.string().trim().min(1, "Please enter your name."),
  senderEmail: z.string().trim().min(1, "Please enter your email address.").email("Please enter a valid email address."),
  deliveryDate: z.string().optional(),
  giftMessage: z.string().optional(),
  message: z.string().optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
