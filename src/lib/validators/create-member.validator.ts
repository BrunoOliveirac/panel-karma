import * as z from "zod";

/**
 * Build the password validation schema for member creation.
 * @param t Translation function for validation messages.
 */
const passwordSchema = (t: (key: string) => string) =>
  z
    .string()
    .min(1, t("validation.required"))
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/);

/**
 * Build the Zod schema for the create member form.
 * @param t Translation function for validation messages.
 */
const createMemberValidator = (t: (key: string) => string) =>
  z
    .object({
      name: z.string().min(1, t("validation.required")),
      email: z
        .string()
        .min(1, t("validation.required"))
        .email(t("validation.email")),
      password: passwordSchema(t),
      confirmPassword: z.string().min(1, t("validation.required")),
      projectIds: z.array(z.string()).optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.password_match"),
      path: ["confirmPassword"],
    });

type CreateMemberForm = z.infer<ReturnType<typeof createMemberValidator>>;

export { createMemberValidator, type CreateMemberForm };
