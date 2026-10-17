/* eslint-disable @typescript-eslint/no-explicit-any */
import { startSupportValidator } from "./start-support.validator";

const t = ((key: string) => key) as any;
const schema = startSupportValidator(t);

describe("startSupportValidator", () => {
  it("accepts a title and a description", () => {
    expect(
      schema.parse({ title: "Printer", description: "Paper jam" }),
    ).toEqual({
      title: "Printer",
      description: "Paper jam",
    });
  });

  it("rejects an empty title or description", () => {
    expect(
      schema.safeParse({ title: "", description: "Paper jam" }).success,
    ).toBe(false);
    expect(
      schema.safeParse({ title: "Printer", description: "" }).success,
    ).toBe(false);
  });

  it("rejects a title longer than 255 characters", () => {
    expect(
      schema.safeParse({ title: "a".repeat(256), description: "Paper jam" })
        .success,
    ).toBe(false);
  });

  it("strips HTML from the title and the description", () => {
    expect(
      schema.parse({
        title: "<b>Printer</b>",
        description: "<p>Paper jam</p>",
      }),
    ).toEqual({ title: "Printer", description: "Paper jam" });
  });
});
