import { changePasswordValidator } from "./change-password.validator";

const t = (key: string) => key;
const schema = changePasswordValidator(t);
const validPassword = "Password1!";

describe("changePasswordValidator", () => {
  it("accepts matching strong passwords", () => {
    expect(
      schema.parse({
        password: validPassword,
        confirmPassword: validPassword,
      }),
    ).toEqual({ password: validPassword, confirmPassword: validPassword });
  });

  it("rejects when confirm password is empty", () => {
    expect(
      schema.safeParse({ password: validPassword, confirmPassword: "" })
        .success,
    ).toBe(false);
  });

  it("rejects when passwords do not match", () => {
    const result = schema.safeParse({
      password: validPassword,
      confirmPassword: "OtherPass1!",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("validation.password_match");
    }
  });
});
