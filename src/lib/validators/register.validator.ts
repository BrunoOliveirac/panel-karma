import * as z from "zod";

export const registerValidator = (t: (key: string) => string) => {
  return z
    .object({
      name: z.string().min(1, t("validation.required")),
      email: z
        .string()
        .min(1, t("validation.required"))
        .email(t("validation.email")),
      password: z
        .string()
        .min(1, t("validation.required"))
        .min(8)
        .regex(/[A-Z]/)
        .regex(/[a-z]/)
        .regex(/[0-9]/)
        .regex(/[^A-Za-z0-9]/),
      confirmPassword: z.string().min(1, t("validation.required")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.password_match"),
      path: ["confirmPassword"],
    });
};
