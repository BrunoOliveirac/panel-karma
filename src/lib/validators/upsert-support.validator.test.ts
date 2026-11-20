import { upsertSupportValidator } from "./upsert-support.validator";

const t = (key: string) => key;
const validPassword = "Password1!";

const baseSupport = {
  name: "Support 01",
  email: "support@email.com",
};

describe("upsertSupportValidator", () => {
  it("requires a strong password when creating", () => {
    const schema = upsertSupportValidator(t, false);

    expect(
      schema.safeParse({
        ...baseSupport,
        password: validPassword,
        confirmPassword: validPassword,
      }).success,
    ).toBe(true);

    expect(schema.safeParse(baseSupport).success).toBe(false);
  });

  it("rejects password mismatch when creating", () => {
    const result = upsertSupportValidator(t, false).safeParse({
      ...baseSupport,
      password: validPassword,
      confirmPassword: "OtherPass1!",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.message === "validation.password_match",
        ),
      ).toBe(true);
    }
  });

  it("skips password validation when editing", () => {
    const schema = upsertSupportValidator(t, true);
    expect(schema.parse(baseSupport)).toMatchObject(baseSupport);
  });
});
