import * as z from "zod";

export const upsertProjectValidator = (t: (key: string) => string) => {
  return z.object({
    name: z.string().min(1, t("validation.required")),
    active: z.boolean(),
    clientId: z.string().min(1, t("validation.required")),
  });
};
