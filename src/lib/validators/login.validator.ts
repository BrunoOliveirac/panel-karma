import * as z from "zod";

import { sanitizedString } from "@/lib/validators/sanitized-string";

export const loginValidator = (t: (key: string) => string) => {
  return z.object({
    email: sanitizedString()
      .pipe(z.string().min(1, t("validation.required")).email(t("validation.email"))),
    password: sanitizedString().pipe(
      z.string().min(1, t("validation.required")).min(8),
    ),
  });
};
