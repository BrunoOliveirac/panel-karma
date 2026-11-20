import { loginValidator } from "./login.validator";

const t = (key: string) => key;
const schema = loginValidator(t);

describe("loginValidator", () => {
  it("accepts a valid email and password", () => {
    expect(
      schema.parse({ email: "user@email.com", password: "password1" }),
    ).toEqual({ email: "user@email.com", password: "password1" });
  });

  it("rejects an empty email", () => {
    const result = schema.safeParse({ email: "", password: "password1" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = schema.safeParse({
      email: "not-an-email",
      password: "password1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = schema.safeParse({
      email: "user@email.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("strips HTML from email and password before validating", () => {
    expect(
      schema.parse({
        email: "<b>user@email.com</b>",
        password: "<i>password1</i>",
      }),
    ).toEqual({ email: "user@email.com", password: "password1" });
  });
});
