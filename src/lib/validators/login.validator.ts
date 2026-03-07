import * as z from "zod";

export const loginValidator = (t: (key: string) => string) => {
  return z.object({
    email: z
      .string()
      .min(1, t("validation.required"))
      .email(t("validation.email")),
    password: z.string().min(1, t("validation.required")).min(8),
  });
};
