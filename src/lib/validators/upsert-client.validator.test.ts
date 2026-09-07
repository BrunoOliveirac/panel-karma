/* eslint-disable @typescript-eslint/no-explicit-any */
import { upsertClientValidator } from "./upsert-client.validator";

const t = ((key: string) => key) as any;
const schema = upsertClientValidator(t);

const validInput = {
  name: "Client 01",
  email: "client@email.com",
  phone: "12345678",
  budget: 1500,
  notes: "Some notes",
};

describe("upsertClientValidator", () => {
  it("accepts a valid client payload", () => {
    expect(schema.parse(validInput)).toEqual(validInput);
  });

  it("rejects a missing name", () => {
    expect(schema.safeParse({ ...validInput, name: "" }).success).toBe(false);
  });

  it("rejects a budget of zero", () => {
    expect(schema.safeParse({ ...validInput, budget: 0 }).success).toBe(false);
  });

  it("rejects a phone shorter than 8 characters", () => {
    expect(schema.safeParse({ ...validInput, phone: "1234567" }).success).toBe(
      false,
    );
  });

  it("rejects notes longer than 500 characters", () => {
    expect(
      schema.safeParse({ ...validInput, notes: "x".repeat(501) }).success,
    ).toBe(false);
  });

  it("strips HTML from name and notes", () => {
    expect(
      schema.parse({
        ...validInput,
        name: "<b>Client 01</b>",
        notes: "<script>alert(1)</script>ok",
      }),
    ).toMatchObject({ name: "Client 01", notes: "alert(1)ok" });
  });
});
