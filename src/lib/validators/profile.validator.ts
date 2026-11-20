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

/**
 * Build the Zod schema for the profile form.
 * Password is optional; when provided, the same rules as register/create-member apply.
 */
const profileValidator = (t: (key: string) => string) =>
  z
    .object({
      name: sanitizedString().pipe(
        z.string().min(1, t("validation.required")),
      ),
      email: sanitizedString().pipe(
        z
          .string()
          .min(1, t("validation.required"))
          .email(t("validation.email")),
      ),
      avatar: z.string().nullable().optional(),
      password: sanitizedString().optional(),
      confirmPassword: sanitizedString().optional(),
    })
    .superRefine((data, ctx) => {
      const password = data.password ?? "";
      const confirmPassword = data.confirmPassword ?? "";

      if (!password && !confirmPassword) return;

      const passwordResult = passwordSchema(t).safeParse(password);
      if (!passwordResult.success) {
        passwordResult.error.issues.forEach((issue) => {
          ctx.addIssue({ ...issue, path: ["password"] });
        });
      }

      if (!confirmPassword) {
        ctx.addIssue({
          code: "custom",
          message: t("validation.required"),
          path: ["confirmPassword"],
        });
      } else if (password !== confirmPassword) {
        ctx.addIssue({
          code: "custom",
          message: t("validation.password_match"),
          path: ["confirmPassword"],
        });
      }
    });

type ProfileForm = z.infer<ReturnType<typeof profileValidator>>;

export { profileValidator, type ProfileForm };
