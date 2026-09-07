import { upserSectorValidator } from "./upsert-sector.validator";

const t = (key: string) => key;
const schema = upserSectorValidator(t);

describe("upserSectorValidator", () => {
  it("accepts a valid sector payload", () => {
    expect(schema.parse({ name: "Finance", active: true })).toEqual({
      name: "Finance",
      active: true,
    });
  });

  it("rejects an empty name", () => {
    expect(schema.safeParse({ name: "", active: false }).success).toBe(false);
  });

  it("strips HTML from the name", () => {
    expect(schema.parse({ name: "<b>Finance</b>", active: true })).toEqual({
      name: "Finance",
      active: true,
    });
  });
});
