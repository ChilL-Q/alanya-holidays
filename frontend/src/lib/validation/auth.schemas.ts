import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Please fill in all fields.").email("Invalid email address"),
  password: z.string().trim().min(1, "Please fill in all fields."),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Please fill in all fields."),
    email: z.string().trim().min(1, "Please fill in all fields.").email("Invalid email address"),
    password: z.string().min(1, "Please fill in all fields.").min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please fill in all fields."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Please enter your email address.").email("Invalid email address"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
