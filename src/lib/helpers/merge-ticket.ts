import { TicketStatusEnum } from "../enums/ticket-status.enum";
import { UserTypeEnum } from "../enums/user-type.enum";
import { Ticket, TicketCounts } from "../models/ticket";

const OWNER_ROLES = new Set<UserTypeEnum>([
  UserTypeEnum.USER,
  UserTypeEnum.MEMBER,
]);

function isOlderThanCurrent(incoming: Ticket, current: Ticket): boolean {
  if (!incoming.updatedAt || !current.updatedAt) return false;

  const incomingTime = Date.parse(incoming.updatedAt);
  const currentTime = Date.parse(current.updatedAt);
  if (Number.isNaN(incomingTime) || Number.isNaN(currentTime)) return false;

  return incomingTime < currentTime;
}

/**
 * Ignore an event that is older than the copy already on screen,
 * or a repeat of that same status.
 */
export function shouldIgnoreTicketEvent(
  incoming: Ticket,
  current?: Ticket,
): boolean {
  if (!current) return false;
  if (isOlderThanCurrent(incoming, current)) return true;
  if (!incoming.updatedAt || !current.updatedAt) return false;

  const incomingTime = Date.parse(incoming.updatedAt);
  const currentTime = Date.parse(current.updatedAt);
  if (Number.isNaN(incomingTime) || Number.isNaN(currentTime)) return false;

  return incomingTime === currentTime && incoming.status === current.status;
}

/**
 * Prefer the status sent by the server. Fall back to the row already listed
 * so a repeated create does not increment the counters again.'
 */
export function resolvePreviousStatus(
  previousStatus: TicketStatusEnum | null,
  listed?: Ticket,
): TicketStatusEnum | null {
  return previousStatus ?? listed?.status ?? null;
}

function matchesQuery(ticket: Ticket, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  if (
    `${ticket.title}\n${ticket.description}`.toLowerCase().includes(normalized)
  ) {
    return true;
  }

  if (ticket.code == null) return false;
  if (String(ticket.code).includes(normalized)) return true;

  const code = codeQuery(normalized);
  return code != null && ticket.code === code;
}

/**
 * Sequential code with at least two digits: 01, 08, 10, 166, 1090.
 */
export function formatTicketCode(code: number): string {
  return String(code).padStart(2, "0");
}

function codeQuery(query: string): number | null {
  const value = query.startsWith("#") ? query.slice(1).trim() : query;
  if (!/^\d+$/.test(value)) return null;

  const code = Number(value);
  return Number.isSafeInteger(code) ? code : null;
}

/**
 * Whether this ticket still belongs on the current page.
 * Support's open view is every OPEN ticket. Other support statuses stay on their id.
 */
export function ticketMatchesList(
  ticket: Ticket,
  role: UserTypeEnum,
  viewerId: string,
  status: TicketStatusEnum | null,
  query: string,
): boolean {
  if (!matchesQuery(ticket, query)) return false;

  if (role === UserTypeEnum.SUPPORT) {
    const openView = status == null || status === TicketStatusEnum.OPEN;
    if (openView) return ticket.status === TicketStatusEnum.OPEN;
    return ticket.supportId === viewerId && ticket.status === status;
  }

  if (!OWNER_ROLES.has(role) || ticket.userId !== viewerId) return false;
  if (status == null) return true;
  return ticket.status === status;
}

function utcDayStart(date: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return Number.NaN;

  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * Same bounds as the list query: start of the start day, exclusive start of the day after the end day, both in UTC.
 */
function matchesCreatedRange(
  ticket: Ticket,
  startDate: string,
  endDate: string,
): boolean {
  if (!startDate && !endDate) return true;
  if (!ticket.createdAt) return false;

  const createdAt = Date.parse(ticket.createdAt);
  if (Number.isNaN(createdAt)) return false;

  if (startDate) {
    const start = utcDayStart(startDate);
    if (!Number.isNaN(start) && createdAt < start) return false;
  }

  if (endDate) {
    const end = utcDayStart(endDate);
    if (!Number.isNaN(end) && createdAt >= end + 24 * 60 * 60 * 1000) {
      return false;
    }
  }

  return true;
}

function belongsToFilteredList(
  ticket: Ticket,
  role: UserTypeEnum,
  viewerId: string,
  status: TicketStatusEnum | null,
  query: string,
  startDate: string,
  endDate: string,
): boolean {
  if (!ticket.active) return false;
  if (!ticketMatchesList(ticket, role, viewerId, status, query)) return false;
  return matchesCreatedRange(ticket, startDate, endDate);
}

/**
 * Whether this event adds or removes a row from the filtered list.
 * Replacing a ticket that stays on the filter does not.
 */
export function ticketChangesFilteredSet(
  tickets: Ticket[],
  ticket: Ticket,
  role: UserTypeEnum,
  viewerId: string,
  status: TicketStatusEnum | null,
  query: string,
  startDate = "",
  endDate = "",
): boolean {
  const listed = tickets.some((item) => item.id === ticket.id);
  const matches = belongsToFilteredList(
    ticket,
    role,
    viewerId,
    status,
    query,
    startDate,
    endDate,
  );

  return listed ? !matches : matches;
}

/**
 * Replace a ticket already on the page, or drop it when it leaves the filter.
 * A ticket that is not on this page is not inserted here.
 */
export function updateListedTicket(
  tickets: Ticket[],
  ticket: Ticket,
  role: UserTypeEnum,
  viewerId: string,
  status: TicketStatusEnum | null,
  query: string,
): Ticket[] {
  const index = tickets.findIndex((item) => item.id === ticket.id);
  if (index < 0) return tickets;

  const current = tickets[index];
  if (shouldIgnoreTicketEvent(ticket, current)) return tickets;

  if (!ticketMatchesList(ticket, role, viewerId, status, query)) {
    return tickets.filter((item) => item.id !== ticket.id);
  }

  return tickets.map((item) => (item.id === ticket.id ? ticket : item));
}

type StatusCountKey = "open" | "inProgress" | "resolved" | "cancelled";

function bump(
  counts: TicketCounts,
  key: StatusCountKey,
  delta: number,
): TicketCounts {
  return {
    ...counts,
    [key]: Math.max(0, counts[key] + delta),
  };
}

function withTotal(counts: TicketCounts): TicketCounts {
  return {
    ...counts,
    all: counts.open + counts.inProgress + counts.resolved + counts.cancelled,
  };
}

function statusBucket(
  status: TicketStatusEnum | null,
  includeOpen: boolean,
): StatusCountKey | null {
  if (status === TicketStatusEnum.OPEN) return includeOpen ? "open" : null;
  if (status === TicketStatusEnum.IN_PROGRESS) return "inProgress";
  if (status === TicketStatusEnum.RESOLVED) return "resolved";
  if (status === TicketStatusEnum.CANCELLED) return "cancelled";
  return null;
}

function moveBucket(
  counts: TicketCounts,
  previousStatus: TicketStatusEnum | null,
  nextStatus: TicketStatusEnum,
  includeOpen: boolean,
): TicketCounts {
  const from = statusBucket(previousStatus, includeOpen);
  const to = statusBucket(nextStatus, includeOpen);
  let next = counts;

  if (from && from !== to) next = bump(next, from, -1);
  if (to && from !== to) next = bump(next, to, 1);
  return next;
}

/**
 * Adjust the status cards from a status change, then set all to their sum.
 * A null previous status means the ticket was just created.
 * User and member buckets follow userId. Support open is global.
 * Support's other statuses follow supportId.
 */
export function applyTicketCountDelta(
  counts: TicketCounts,
  role: UserTypeEnum,
  viewerId: string,
  previousStatus: TicketStatusEnum | null,
  incoming: Ticket,
): TicketCounts {
  if (role === UserTypeEnum.SUPPORT) {
    return applySupportCountDelta(counts, viewerId, previousStatus, incoming);
  }

  if (!OWNER_ROLES.has(role) || incoming.userId !== viewerId) return counts;

  return withTotal(moveBucket(counts, previousStatus, incoming.status, true));
}

function applyOpenDelta(
  counts: TicketCounts,
  previousStatus: TicketStatusEnum | null,
  nextStatus: TicketStatusEnum,
): TicketCounts {
  const wasOpen = previousStatus === TicketStatusEnum.OPEN;
  const isOpen = nextStatus === TicketStatusEnum.OPEN;
  if (wasOpen === isOpen) return counts;
  return bump(counts, "open", wasOpen ? -1 : 1);
}

function applySupportCountDelta(
  counts: TicketCounts,
  viewerId: string,
  previousStatus: TicketStatusEnum | null,
  incoming: Ticket,
): TicketCounts {
  let next = applyOpenDelta(counts, previousStatus, incoming.status);

  if (incoming.supportId === viewerId) {
    next = moveBucket(next, previousStatus, incoming.status, false);
  }

  return withTotal(next);
}
