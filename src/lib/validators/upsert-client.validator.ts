/* eslint-disable @typescript-eslint/no-explicit-any */
import { _Translator } from "next-intl";
import * as z from "zod";

export const upsertClientValidator = (t: _Translator<Record<string, any>>) => {
  return z.object({
    name: z.string().min(1, t("validation.required")),
    email: z
      .string()
      .min(1, t("validation.required"))
      .email(t("validation.email")),
    phone: z.string().min(1, t("validation.required")).min(8),
    budget: z.number().min(1, t("validation.required")),
    sectorId: z.string().optional(),
    notes: z
      .string()
      .max(500, t("validation.max_length", { max: 500 }))
      .optional(),
  });
};
