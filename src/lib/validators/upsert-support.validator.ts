import * as z from "zod";

import { sanitizedString } from "@/lib/validators/sanitized-string";

const passwordSchema = (t: (key: string) => string) =>
  sanitizedString().pipe(
    z
      .string()
      .min(1, t("validation.required"))
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/),
  );

const upsertSupportBaseSchema = (t: (key: string) => string) =>
  z.object({
    name: sanitizedString().pipe(z.string().min(1, t("validation.required"))),
    email: sanitizedString().pipe(
      z
        .string()
        .min(1, t("validation.required"))
        .email(t("validation.email")),
    ),
    password: sanitizedString().optional(),
    confirmPassword: sanitizedString().optional(),
  });

export type UpsertSupportForm = z.infer<
  ReturnType<typeof upsertSupportBaseSchema>
>;

export const upsertSupportValidator = (
  t: (key: string) => string,
  isEdit: boolean,
) => {
  return upsertSupportBaseSchema(t).superRefine((data, ctx) => {
    if (isEdit) return;

    const passwordResult = passwordSchema(t).safeParse(data.password ?? "");
    if (!passwordResult.success) {
      passwordResult.error.issues.forEach((issue) => {
        ctx.addIssue({ ...issue, path: ["password"] });
      });
    }

    if (!data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: t("validation.required"),
        path: ["confirmPassword"],
      });
    }

    if (data.confirmPassword && data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: t("validation.password_match"),
        path: ["confirmPassword"],
      });
    }
  });
};
