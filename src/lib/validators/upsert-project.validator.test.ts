import { upsertProjectValidator } from "./upsert-project.validator";

const t = (key: string) => key;
const schema = upsertProjectValidator(t);

describe("upsertProjectValidator", () => {
  it("accepts a valid project payload", () => {
    expect(schema.parse({ name: "Project A", active: true, clientId: "c1" })).toEqual({
      name: "Project A",
      active: true,
      clientId: "c1",
    });
  });

  it("rejects an empty name", () => {
    expect(
      schema.safeParse({ name: "", active: true, clientId: "c1" }).success,
    ).toBe(false);
  });

  it("rejects a missing client", () => {
    expect(
      schema.safeParse({ name: "Project A", active: false, clientId: "" })
        .success,
    ).toBe(false);
  });
});
