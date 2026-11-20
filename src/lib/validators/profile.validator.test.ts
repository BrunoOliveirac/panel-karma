import { profileValidator } from "./profile.validator";

const t = (key: string) => key;
const schema = profileValidator(t);
const validPassword = "Password1!";

const baseProfile = {
  name: "Test User",
  email: "user@email.com",
  avatar: null,
};

describe("profileValidator", () => {
  it("accepts name and email without a password", () => {
    expect(schema.parse(baseProfile)).toMatchObject(baseProfile);
  });

  it("accepts a strong password when confirmation matches", () => {
    expect(
      schema.parse({
        ...baseProfile,
        password: validPassword,
        confirmPassword: validPassword,
      }),
    ).toMatchObject({ password: validPassword, confirmPassword: validPassword });
  });

  it("rejects an empty name", () => {
    expect(schema.safeParse({ ...baseProfile, name: "" }).success).toBe(false);
  });

  it("requires confirmation when a password is provided", () => {
    const result = schema.safeParse({
      ...baseProfile,
      password: validPassword,
      confirmPassword: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "confirmPassword")).toBe(
        true,
      );
    }
  });

  it("rejects a weak password when one is provided", () => {
    expect(
      schema.safeParse({
        ...baseProfile,
        password: "weak",
        confirmPassword: "weak",
      }).success,
    ).toBe(false);
  });

  it("rejects when passwords do not match", () => {
    const result = schema.safeParse({
      ...baseProfile,
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
});
