import { TicketStatusEnum } from "../enums/ticket-status.enum";
import { UserTypeEnum } from "../enums/user-type.enum";
import {
  applyTicketCountDelta,
  formatTicketCode,
  resolvePreviousStatus,
  shouldIgnoreTicketEvent,
  ticketChangesFilteredSet,
  updateListedTicket,
} from "./merge-ticket";
import { Ticket, TicketCounts } from "../models/ticket";

function ticket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: "t1",
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    title: "Help",
    description: "Details",
    status: TicketStatusEnum.OPEN,
    userId: "u1",
    supportId: null,
    ...overrides,
  };
}

const counts: TicketCounts = {
  open: 4,
  inProgress: 2,
  resolved: 1,
  cancelled: 1,
  all: 8,
};

describe("formatTicketCode", () => {
  it("pads codes below 10 and leaves the rest unchanged", () => {
    expect(formatTicketCode(1)).toBe("01");
    expect(formatTicketCode(8)).toBe("08");
    expect(formatTicketCode(10)).toBe("10");
    expect(formatTicketCode(166)).toBe("166");
    expect(formatTicketCode(1090)).toBe("1090");
  });
});

describe("shouldIgnoreTicketEvent", () => {
  it("ignores an older event and a repeat of the same status", () => {
    const current = ticket({ updatedAt: "2026-01-03T00:00:00.000Z" });

    expect(
      shouldIgnoreTicketEvent(
        ticket({ updatedAt: "2026-01-01T00:00:00.000Z" }),
        current,
      ),
    ).toBe(true);
    expect(
      shouldIgnoreTicketEvent(
        ticket({ title: "Same moment", updatedAt: current.updatedAt }),
        current,
      ),
    ).toBe(true);
  });

  it("keeps a status change that shares the listed timestamp", () => {
    const current = ticket({ updatedAt: "2026-01-03T00:00:00.000Z" });

    expect(
      shouldIgnoreTicketEvent(
        ticket({
          status: TicketStatusEnum.IN_PROGRESS,
          updatedAt: current.updatedAt,
        }),
        current,
      ),
    ).toBe(false);
  });

  it("keeps an event when either copy has no timestamp", () => {
    expect(
      shouldIgnoreTicketEvent(ticket({ updatedAt: undefined }), ticket()),
    ).toBe(false);
    expect(shouldIgnoreTicketEvent(ticket(), undefined)).toBe(false);
  });
});

describe("updateListedTicket", () => {
  it("replaces a ticket already on the page", () => {
    const current = ticket({ title: "Old" });
    const incoming = ticket({
      title: "New",
      updatedAt: "2026-01-03T00:00:00.000Z",
    });

    expect(
      updateListedTicket(
        [current],
        incoming,
        UserTypeEnum.USER,
        "u1",
        null,
        "",
      ),
    ).toEqual([incoming]);
  });

  it("leaves the page unchanged when the ticket is not listed", () => {
    const listed = ticket();
    const incoming = ticket({
      id: "t2",
      updatedAt: "2026-01-03T00:00:00.000Z",
    });

    expect(
      updateListedTicket(
        [listed],
        incoming,
        UserTypeEnum.SUPPORT,
        "s1",
        TicketStatusEnum.OPEN,
        "",
      ),
    ).toEqual([listed]);
  });

  it("keeps the listed ticket when the event is older", () => {
    const current = ticket({ updatedAt: "2026-01-03T00:00:00.000Z" });
    const incoming = ticket({
      title: "Stale",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    const tickets = [current];

    expect(
      updateListedTicket(
        tickets,
        incoming,
        UserTypeEnum.SUPPORT,
        "s1",
        TicketStatusEnum.OPEN,
        "",
      ),
    ).toBe(tickets);
  });

  it("removes an open ticket from the support queue when it leaves that status", () => {
    const current = ticket();
    const incoming = ticket({
      status: TicketStatusEnum.IN_PROGRESS,
      supportId: "s1",
      updatedAt: "2026-01-03T00:00:00.000Z",
    });

    expect(
      updateListedTicket(
        [current],
        incoming,
        UserTypeEnum.SUPPORT,
        "s1",
        TicketStatusEnum.OPEN,
        "",
      ),
    ).toEqual([]);
    expect(
      updateListedTicket(
        [current],
        incoming,
        UserTypeEnum.SUPPORT,
        "s1",
        null,
        "",
      ),
    ).toEqual([]);
  });

  it("keeps only the assignee on a support status filter", () => {
    const incoming = ticket({
      status: TicketStatusEnum.IN_PROGRESS,
      supportId: "s1",
      title: "Mine",
      updatedAt: "2026-01-03T00:00:00.000Z",
    });

    expect(
      updateListedTicket(
        [ticket({ status: TicketStatusEnum.IN_PROGRESS, supportId: "s1" })],
        incoming,
        UserTypeEnum.SUPPORT,
        "s1",
        TicketStatusEnum.IN_PROGRESS,
        "",
      ),
    ).toEqual([incoming]);

    expect(
      updateListedTicket(
        [ticket({ status: TicketStatusEnum.IN_PROGRESS, supportId: "s2" })],
        ticket({
          status: TicketStatusEnum.IN_PROGRESS,
          supportId: "s2",
          updatedAt: "2026-01-03T00:00:00.000Z",
        }),
        UserTypeEnum.SUPPORT,
        "s1",
        TicketStatusEnum.IN_PROGRESS,
        "",
      ),
    ).toEqual([]);
  });

  it("keeps a ticket when the search matches its code", () => {
    const current = ticket({ code: 8 });
    const incoming = ticket({
      code: 8,
      updatedAt: "2026-01-03T00:00:00.000Z",
    });

    expect(
      updateListedTicket(
        [current],
        incoming,
        UserTypeEnum.USER,
        "u1",
        null,
        "#08",
      ),
    ).toEqual([incoming]);

    expect(
      updateListedTicket(
        [ticket({ code: 1090 })],
        ticket({ code: 1090, updatedAt: "2026-01-03T00:00:00.000Z" }),
        UserTypeEnum.USER,
        "u1",
        null,
        "109",
      ),
    ).toHaveLength(1);
  });

  it("drops a ticket when the search misses the title, description, and code", () => {
    const current = ticket({
      title: "Printer",
      description: "Paper jam",
      code: 12,
    });
    const incoming = ticket({
      title: "Printer",
      description: "Paper jam",
      code: 12,
      updatedAt: "2026-01-03T00:00:00.000Z",
    });

    expect(
      updateListedTicket(
        [current],
        incoming,
        UserTypeEnum.USER,
        "u1",
        null,
        "scanner",
      ),
    ).toEqual([]);
  });

  it("drops a ticket when a padded code does not match", () => {
    const current = ticket({ code: 10 });
    const incoming = ticket({
      code: 10,
      updatedAt: "2026-01-03T00:00:00.000Z",
    });

    expect(
      updateListedTicket(
        [current],
        incoming,
        UserTypeEnum.USER,
        "u1",
        null,
        "01",
      ),
    ).toEqual([]);
  });

  it("keeps an in-progress ticket on the user list when the filter is all", () => {
    const current = ticket();
    const incoming = ticket({
      status: TicketStatusEnum.IN_PROGRESS,
      updatedAt: "2026-01-03T00:00:00.000Z",
    });

    expect(
      updateListedTicket(
        [current],
        incoming,
        UserTypeEnum.USER,
        "u1",
        null,
        "",
      ),
    ).toEqual([incoming]);
  });

  it("removes a resolved ticket from the in-progress filter", () => {
    const current = ticket({ status: TicketStatusEnum.IN_PROGRESS });
    const incoming = ticket({
      status: TicketStatusEnum.RESOLVED,
      updatedAt: "2026-01-03T00:00:00.000Z",
    });

    expect(
      updateListedTicket(
        [current],
        incoming,
        UserTypeEnum.MEMBER,
        "u1",
        TicketStatusEnum.IN_PROGRESS,
        "",
      ),
    ).toEqual([]);
  });

  it("does not mutate the previous list", () => {
    const tickets = [ticket()];
    const incoming = ticket({
      title: "New",
      updatedAt: "2026-01-03T00:00:00.000Z",
    });

    updateListedTicket(tickets, incoming, UserTypeEnum.USER, "u1", null, "");

    expect(tickets).toHaveLength(1);
    expect(tickets[0]?.title).toBe("Help");
  });
});

describe("ticketChangesFilteredSet", () => {
  it("reloads when a new ticket belongs on the all view", () => {
    expect(
      ticketChangesFilteredSet(
        [ticket()],
        ticket({ id: "t2" }),
        UserTypeEnum.USER,
        "u1",
        null,
        "",
      ),
    ).toBe(true);
  });

  it("keeps the list when a new ticket is outside the status filter", () => {
    expect(
      ticketChangesFilteredSet(
        [ticket({ status: TicketStatusEnum.RESOLVED })],
        ticket({ id: "t2", status: TicketStatusEnum.OPEN }),
        UserTypeEnum.USER,
        "u1",
        TicketStatusEnum.RESOLVED,
        "",
      ),
    ).toBe(false);
  });

  it("reloads when an open ticket leaves the support queue", () => {
    expect(
      ticketChangesFilteredSet(
        [ticket()],
        ticket({
          status: TicketStatusEnum.IN_PROGRESS,
          supportId: "s1",
        }),
        UserTypeEnum.SUPPORT,
        "s1",
        TicketStatusEnum.OPEN,
        "",
      ),
    ).toBe(true);
  });

  it("patches in place when the listed ticket stays on the filter", () => {
    expect(
      ticketChangesFilteredSet(
        [ticket()],
        ticket({ title: "Renamed", status: TicketStatusEnum.IN_PROGRESS }),
        UserTypeEnum.USER,
        "u1",
        null,
        "",
      ),
    ).toBe(false);
  });

  it("reloads a new ticket inside the created-at range", () => {
    expect(
      ticketChangesFilteredSet(
        [],
        ticket({ createdAt: "2026-01-15T12:00:00.000Z" }),
        UserTypeEnum.USER,
        "u1",
        null,
        "",
        "2026-01-01",
        "2026-01-31",
      ),
    ).toBe(true);
  });

  it("skips an inactive ticket and reloads when a listed one is deactivated", () => {
    expect(
      ticketChangesFilteredSet(
        [],
        ticket({ active: false }),
        UserTypeEnum.USER,
        "u1",
        null,
        "",
      ),
    ).toBe(false);

    expect(
      ticketChangesFilteredSet(
        [ticket()],
        ticket({ active: false }),
        UserTypeEnum.USER,
        "u1",
        null,
        "",
      ),
    ).toBe(true);
  });

  it("skips a new ticket outside the created-at range", () => {
    expect(
      ticketChangesFilteredSet(
        [],
        ticket({ createdAt: "2026-02-01T00:00:00.000Z" }),
        UserTypeEnum.USER,
        "u1",
        null,
        "",
        "2026-01-01",
        "2026-01-31",
      ),
    ).toBe(false);
  });

  it("includes the last evening of the end day in the viewer time zone", () => {
    expect(
      ticketChangesFilteredSet(
        [],
        ticket({ createdAt: "2026-02-01T02:00:00.000Z" }),
        UserTypeEnum.USER,
        "u1",
        null,
        "",
        "2026-01-01",
        "2026-01-31",
        "America/Sao_Paulo",
      ),
    ).toBe(true);
  });

  it("excludes that evening when the same dates are read in UTC", () => {
    expect(
      ticketChangesFilteredSet(
        [],
        ticket({ createdAt: "2026-02-01T02:00:00.000Z" }),
        UserTypeEnum.USER,
        "u1",
        null,
        "",
        "2026-01-01",
        "2026-01-31",
        "UTC",
      ),
    ).toBe(false);
  });
});

describe("applyTicketCountDelta", () => {
  it("counts a new open ticket on the user open card and the total", () => {
    expect(
      applyTicketCountDelta(counts, UserTypeEnum.USER, "u1", null, ticket()),
    ).toEqual({ ...counts, open: 5, all: 9 });
  });

  it("moves a user ticket from open into in progress", () => {
    expect(
      applyTicketCountDelta(
        counts,
        UserTypeEnum.MEMBER,
        "u1",
        TicketStatusEnum.OPEN,
        ticket({ status: TicketStatusEnum.IN_PROGRESS }),
      ),
    ).toEqual({ ...counts, open: 3, inProgress: 3 });
  });

  it("moves a user ticket from in progress to resolved", () => {
    expect(
      applyTicketCountDelta(
        counts,
        UserTypeEnum.USER,
        "u1",
        TicketStatusEnum.IN_PROGRESS,
        ticket({ status: TicketStatusEnum.RESOLVED }),
      ),
    ).toEqual({ ...counts, inProgress: 1, resolved: 2 });
  });

  it("moves a user ticket from open to cancelled without changing the total", () => {
    expect(
      applyTicketCountDelta(
        counts,
        UserTypeEnum.USER,
        "u1",
        TicketStatusEnum.OPEN,
        ticket({ status: TicketStatusEnum.CANCELLED }),
      ),
    ).toEqual({ ...counts, open: 3, cancelled: 2 });
  });

  it("ignores a ticket that belongs to another user", () => {
    expect(
      applyTicketCountDelta(
        counts,
        UserTypeEnum.USER,
        "u1",
        null,
        ticket({ userId: "other" }),
      ),
    ).toBe(counts);
  });

  it("counts a new open ticket for every support", () => {
    expect(
      applyTicketCountDelta(counts, UserTypeEnum.SUPPORT, "s1", null, ticket()),
    ).toEqual({ ...counts, open: 5, all: 9 });
  });

  it("moves the support open count into in progress only for the assignee", () => {
    const incoming = ticket({
      status: TicketStatusEnum.IN_PROGRESS,
      supportId: "s1",
    });

    expect(
      applyTicketCountDelta(
        counts,
        UserTypeEnum.SUPPORT,
        "s1",
        TicketStatusEnum.OPEN,
        incoming,
      ),
    ).toEqual({ ...counts, open: 3, inProgress: 3 });
  });

  it("moves the assignee from in progress to resolved", () => {
    expect(
      applyTicketCountDelta(
        counts,
        UserTypeEnum.SUPPORT,
        "s1",
        TicketStatusEnum.IN_PROGRESS,
        ticket({ status: TicketStatusEnum.RESOLVED, supportId: "s1" }),
      ),
    ).toEqual({ ...counts, inProgress: 1, resolved: 2 });
  });

  it("leaves the assignee buckets alone when another support resolves", () => {
    expect(
      applyTicketCountDelta(
        counts,
        UserTypeEnum.SUPPORT,
        "s1",
        TicketStatusEnum.IN_PROGRESS,
        ticket({ status: TicketStatusEnum.RESOLVED, supportId: "s2" }),
      ),
    ).toEqual(counts);
  });

  it("decrements only the open count when another support accepts the ticket", () => {
    const incoming = ticket({
      status: TicketStatusEnum.IN_PROGRESS,
      supportId: "s2",
    });

    expect(
      applyTicketCountDelta(
        counts,
        UserTypeEnum.SUPPORT,
        "s1",
        TicketStatusEnum.OPEN,
        incoming,
      ),
    ).toEqual({ ...counts, open: 3, all: 7 });
  });

  it("uses the listed status when the event has no previous status", () => {
    const listed = ticket({ status: TicketStatusEnum.IN_PROGRESS });

    expect(resolvePreviousStatus(null, listed)).toBe(
      TicketStatusEnum.IN_PROGRESS,
    );
    expect(resolvePreviousStatus(TicketStatusEnum.OPEN, listed)).toBe(
      TicketStatusEnum.OPEN,
    );
  });
});
