import { stripHtml, stripHtmlDeep } from "./sanitize-html";

describe("stripHtml", () => {
  it("removes common HTML tags", () => {
    expect(stripHtml("<b>hello</b>")).toBe("hello");
    expect(stripHtml("a <strong>bold</strong> word")).toBe("a bold word");
    expect(stripHtml("line<br/>break")).toBe("linebreak");
    expect(stripHtml('<img src="x" onerror="alert(1)">')).toBe("");
  });

  it("removes HTML comments", () => {
    expect(stripHtml("safe <!-- comment --> text")).toBe("safe  text");
  });

  it("keeps plain text and lone angle brackets that are not tags", () => {
    expect(stripHtml("Tom & Jerry")).toBe("Tom & Jerry");
    expect(stripHtml("5 < 10 and 10 > 5")).toBe("5 < 10 and 10 > 5");
  });
});

describe("stripHtmlDeep", () => {
  it("sanitizes nested string values", () => {
    expect(
      stripHtmlDeep({
        name: "<b>Karma</b>",
        nested: { notes: "<script>alert(1)</script>ok" },
        tags: ["<i>a</i>", "b"],
      }),
    ).toEqual({
      name: "Karma",
      nested: { notes: "alert(1)ok" },
      tags: ["a", "b"],
    });
  });
});
