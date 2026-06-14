import * as z from "zod";

export const upserSectorValidator = (t: (key: string) => string) => {
  return z.object({
    name: z.string().min(1, t("validation.required")),
    active: z.boolean(),
  });
};
