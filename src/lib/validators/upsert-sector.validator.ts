import * as z from "zod";

import { sanitizedString } from "@/lib/validators/sanitized-string";

export const upserSectorValidator = (t: (key: string) => string) => {
  return z.object({
    name: sanitizedString().pipe(z.string().min(1, t("validation.required"))),
    active: z.boolean(),
  });
};
