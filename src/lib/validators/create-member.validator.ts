import * as z from "zod";

import { sanitizedString } from "@/lib/validators/sanitized-string";

/**
 * Build the password validation schema for member creation.
 * @param t Translation function for validation messages.
 */
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
 * Build the Zod schema for the create member form.
 * @param t Translation function for validation messages.
 */
const createMemberValidator = (t: (key: string) => string) =>
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
      password: passwordSchema(t),
      confirmPassword: sanitizedString().pipe(
        z.string().min(1, t("validation.required")),
      ),
      projectIds: z.array(z.string()).optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.password_match"),
      path: ["confirmPassword"],
    });

type CreateMemberForm = z.infer<ReturnType<typeof createMemberValidator>>;

export { createMemberValidator, type CreateMemberForm };
