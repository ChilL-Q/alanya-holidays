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

const optionalTrimmedString = (schema: z.ZodString) =>
  z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    schema.optional()
  );

export const businessRegistrationSchema = z.object({
  businessName: z.string().trim().min(2, "Business name must be at least 2 characters.").max(120, "Business name must be at most 120 characters."),
  accountType: z.enum(["seller", "service_provider", "property_host", "directory_owner"], {
    error: "Please select a valid account type.",
  }),
  contactPhone: optionalTrimmedString(
    z.string().trim().min(7, "Contact phone must be at least 7 characters.").max(32, "Contact phone must be at most 32 characters.")
  ),
  website: optionalTrimmedString(
    z.string().trim().max(2048, "Website must be at most 2048 characters.").url("Website must be a valid URL.").refine(
      (value) => value.startsWith("http://") || value.startsWith("https://"),
      "Website must use http or https."
    )
  ),
});

export type BusinessRegistrationFormData = z.infer<typeof businessRegistrationSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Please enter your email address.").email("Invalid email address"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
