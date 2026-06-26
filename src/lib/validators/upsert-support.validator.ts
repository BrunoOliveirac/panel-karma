import * as z from "zod";

const passwordSchema = (t: (key: string) => string) =>
  z
    .string()
    .min(1, t("validation.required"))
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/);

const upsertSupportBaseSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t("validation.required")),
    email: z
      .string()
      .min(1, t("validation.required"))
      .email(t("validation.email")),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
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

export const changeSupportPasswordValidator = (t: (key: string) => string) => {
  return z
    .object({
      password: passwordSchema(t),
      confirmPassword: z.string().min(1, t("validation.required")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.password_match"),
      path: ["confirmPassword"],
    });
};
