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

const createMemberBaseSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t("validation.required")),
    email: z
      .string()
      .min(1, t("validation.required"))
      .email(t("validation.email")),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
    projectIds: z.array(z.string()).optional(),
  });

export type CreateMemberForm = z.infer<
  ReturnType<typeof createMemberBaseSchema>
>;

export const createMemberValidator = (t: (key: string) => string) => {
  return createMemberBaseSchema(t).superRefine((data, ctx) => {
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
