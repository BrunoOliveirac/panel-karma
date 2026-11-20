import * as z from "zod";

import { sanitizedString } from "@/lib/validators/sanitized-string";

const passwordSchema = (t: (key: string) => string) =>
  sanitizedString().pipe(
    z
      .string()
      .min(1, t("validation.required"))
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/),
  );

export const changePasswordValidator = (t: (key: string) => string) => {
  return z
    .object({
      password: passwordSchema(t),
      confirmPassword: sanitizedString().pipe(
        z.string().min(1, t("validation.required")),
      ),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.password_match"),
      path: ["confirmPassword"],
    });
};
