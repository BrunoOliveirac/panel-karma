import * as z from "zod";

export const upsertClientValidator = (t: (key: string) => string) => {
  return z.object({
    name: z.string().min(1, t("validation.required")),
    email: z
      .string()
      .min(1, t("validation.required"))
      .email(t("validation.email")),
    phone: z.string().min(1, t("validation.required")).min(8),
    budget: z.number().min(1, t("validation.required")),
  });
};
