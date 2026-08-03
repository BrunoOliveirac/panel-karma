/* eslint-disable @typescript-eslint/no-explicit-any */
import { _Translator } from "next-intl";
import * as z from "zod";

import { sanitizedString } from "@/lib/validators/sanitized-string";

export const upsertClientValidator = (t: _Translator<Record<string, any>>) => {
  return z.object({
    name: sanitizedString().pipe(z.string().min(1, t("validation.required"))),
    email: sanitizedString().pipe(
      z
        .string()
        .min(1, t("validation.required"))
        .email(t("validation.email")),
    ),
    phone: sanitizedString().pipe(
      z.string().min(1, t("validation.required")).min(8),
    ),
    budget: z.number().min(1, t("validation.required")),
    sectorId: z.string().optional(),
    notes: sanitizedString()
      .pipe(z.string().max(500, t("validation.max_length", { max: 500 })))
      .optional(),
  });
};
