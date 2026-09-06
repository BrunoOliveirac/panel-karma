import { registerValidator } from "./register.validator";

const t = (key: string) => key;
const schema = registerValidator(t);
const validPassword = "Password1!";

const validInput = {
  name: "Jane Doe",
  email: "jane@email.com",
  password: validPassword,
  confirmPassword: validPassword,
};

describe("registerValidator", () => {
  it("accepts a valid registration payload", () => {
    expect(schema.parse(validInput)).toEqual(validInput);
  });

  it("rejects an empty name", () => {
    expect(schema.safeParse({ ...validInput, name: "" }).success).toBe(false);
  });

  it("rejects when passwords do not match", () => {
    const result = schema.safeParse({
      ...validInput,
      confirmPassword: "OtherPass1!",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
      expect(result.error.issues[0].message).toBe("validation.password_match");
    }
  });

  it.each([
    ["short1!", "too short"],
    ["password1!", "missing uppercase"],
    ["PASSWORD1!", "missing lowercase"],
    ["Password!", "missing number"],
    ["Password1", "missing special"],
  ])("rejects a weak password (%s)", (password) => {
    expect(
      schema.safeParse({ ...validInput, password, confirmPassword: password })
        .success,
    ).toBe(false);
  });

  it("strips HTML from name and email", () => {
    expect(
      schema.parse({
        ...validInput,
        name: "<b>Jane Doe</b>",
        email: "<i>jane@email.com</i>",
      }),
    ).toMatchObject({ name: "Jane Doe", email: "jane@email.com" });
  });
});
