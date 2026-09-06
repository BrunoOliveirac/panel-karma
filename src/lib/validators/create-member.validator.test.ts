import { createMemberValidator } from "./create-member.validator";

const t = (key: string) => key;
const schema = createMemberValidator(t);
const validPassword = "Password1!";

const validInput = {
  name: "New Member",
  email: "member@email.com",
  password: validPassword,
  confirmPassword: validPassword,
  projectIds: ["p1"],
};

describe("createMemberValidator", () => {
  it("accepts a valid member payload", () => {
    expect(schema.parse(validInput)).toEqual(validInput);
  });

  it("allows omitting projectIds", () => {
    const { projectIds: _, ...withoutProjects } = validInput;
    expect(schema.parse(withoutProjects)).toMatchObject({
      name: validInput.name,
      email: validInput.email,
    });
  });

  it("rejects when passwords do not match", () => {
    const result = schema.safeParse({
      ...validInput,
      confirmPassword: "OtherPass1!",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("validation.password_match");
    }
  });
});
