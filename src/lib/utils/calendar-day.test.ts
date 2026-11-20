import {
  addIsoMonths,
  calendarCells,
  presetRange,
  visibleMonths,
  weekStartsOn,
  zonedDayStart,
} from "./calendar-day";

describe("calendar days", () => {
  it("clamps the day when a month is shorter", () => {
    expect(addIsoMonths("2026-03-31", -1)).toBe("2026-02-28");
    expect(addIsoMonths("2024-03-31", -1)).toBe("2024-02-29");
  });

  it("builds inclusive presets that end today", () => {
    expect(presetRange("last_7_days", "2026-10-03")).toEqual({
      startDate: "2026-09-27",
      endDate: "2026-10-03",
    });
    expect(presetRange("last_3_months", "2026-10-03")).toEqual({
      startDate: "2026-07-03",
      endDate: "2026-10-03",
    });
  });

  it("opens a long range on its last two months", () => {
    expect(visibleMonths("2026-04-03", "2026-10-03", "2026-10-03")).toEqual({
      left: "2026-09",
      right: "2026-10",
    });
    expect(visibleMonths("", "", "2026-10-03")).toEqual({
      left: "2026-10",
      right: "2026-11",
    });
  });

  it("starts the week on Sunday in the US and on Monday in Portugal", () => {
    expect(weekStartsOn("en-US")).toBe(0);
    expect(weekStartsOn("pt-PT")).toBe(1);
  });

  it("shows September 2024 from the previous Monday through the following Sunday", () => {
    const cells = calendarCells("2024-09", 1);

    expect(cells).toHaveLength(42);
    expect(cells[0]).toEqual({ iso: "2024-08-26", inMonth: false });
    expect(cells.find((cell) => cell.iso === "2024-09-16")?.inMonth).toBe(true);
  });
});

describe("zonedDayStart", () => {
  it("uses UTC midnight when the zone is UTC", () => {
    expect(zonedDayStart("2026-01-15", "UTC")).toBe(
      Date.parse("2026-01-15T00:00:00.000Z"),
    );
  });

  it("uses the America/Sao_Paulo offset", () => {
    expect(zonedDayStart("2026-01-15", "America/Sao_Paulo")).toBe(
      Date.parse("2026-01-15T03:00:00.000Z"),
    );
  });

  it("follows the short spring-forward day in Europe/Lisbon", () => {
    expect(zonedDayStart("2026-03-29", "Europe/Lisbon")).toBe(
      Date.parse("2026-03-29T00:00:00.000Z"),
    );
    expect(zonedDayStart("2026-03-30", "Europe/Lisbon")).toBe(
      Date.parse("2026-03-29T23:00:00.000Z"),
    );
  });

  it("returns NaN for a calendar day that does not exist", () => {
    expect(zonedDayStart("2026-02-31", "UTC")).toBeNaN();
  });

  it("falls back to UTC for an unknown zone", () => {
    expect(zonedDayStart("2026-01-15", "Not/AZone")).toBe(
      Date.parse("2026-01-15T00:00:00.000Z"),
    );
  });
});
