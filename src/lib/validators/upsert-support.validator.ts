import * as z from "zod";

const passwordSchema = (t: (key: string) => string) =>
  z
    .string()
    .min(1, t("validation.required"))
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/);

export const upsertSupportValidator = (
  t: (key: string) => string,
  isEdit: boolean,
) => {
  const baseSchema = z.object({
    name: z.string().min(1, t("validation.required")),
    email: z
      .string()
      .min(1, t("validation.required"))
      .email(t("validation.email")),
  });

  if (isEdit) return baseSchema;

  return baseSchema
    .extend({
      password: passwordSchema(t),
      confirmPassword: z.string().min(1, t("validation.required")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.password_match"),
      path: ["confirmPassword"],
    });
};

export const changeSupportPasswordValidator = (t: (key: string) => string) => {
  return z
    .object({
      password: passwordSchema(t),
      confirmPassword: z.string().min(1, t("validation.required")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.password_match"),
      path: ["confirmPassword"],
    });
};
