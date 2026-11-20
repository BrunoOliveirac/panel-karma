/* eslint-disable @typescript-eslint/no-explicit-any */
import { _Translator } from "next-intl";
import * as z from "zod";

import { sanitizedString } from "@/lib/validators/sanitized-string";

export const startSupportValidator = (t: _Translator<Record<string, any>>) => {
  return z.object({
    title: sanitizedString().pipe(
      z
        .string()
        .min(1, t("validation.required"))
        .max(255, t("validation.max_length", { max: 255 })),
    ),
    description: sanitizedString().pipe(
      z.string().min(1, t("validation.required")),
    ),
  });
};
