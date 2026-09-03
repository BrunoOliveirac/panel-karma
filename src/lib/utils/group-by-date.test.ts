import { groupByDate } from "./group-by-date";

describe("groupByDate", () => {
  it("groups items by day and sorts newest first", () => {
    const grouped = groupByDate([
      { createdAt: "2026-08-27T12:00:00.000Z", id: "older" },
      { createdAt: "2026-08-28T08:00:00.000Z", id: "morning" },
      { createdAt: "2026-08-28T18:00:00.000Z", id: "evening" },
    ]);

    expect(grouped.map((group) => group.date)).toEqual([
      "2026-08-28",
      "2026-08-27",
    ]);
    expect(grouped[0].datas.map((item) => item.id)).toEqual([
      "evening",
      "morning",
    ]);
  });
});
