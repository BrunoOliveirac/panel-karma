import { TicketStatusEnum } from "../enums/ticket-status.enum";
import { UserTypeEnum } from "../enums/user-type.enum";

export type TicketCardAction = "accept" | "open_chat" | "resolve" | "cancel";

export type TicketTransition = "accept" | "resolve" | "cancel";

export type TicketCardActionSet = {
  primary: TicketCardAction | null;
  menu: TicketCardAction[];
};

export type TicketActionSource = {
  status: TicketStatusEnum;
  supportId?: string | null;
  acceptedAt?: string | null;
};

const OWNER_ROLES = new Set<UserTypeEnum>([
  UserTypeEnum.USER,
  UserTypeEnum.MEMBER,
]);

/**
 * A conversation exists once the ticket has left the open queue.
 * A cancellation that never had an assignee has no chat to open.
 */
export function ticketHasChat(ticket: TicketActionSource): boolean {
  if (ticket.status === TicketStatusEnum.OPEN) return false;

  if (ticket.status === TicketStatusEnum.CANCELLED) {
    return Boolean(ticket.supportId || ticket.acceptedAt);
  }

  return true;
}

/** Route of the chat linked to a ticket. */
export function ticketChatPath(ticketId: string): string {
  return `/chat?ticketId=${encodeURIComponent(ticketId)}`;
}

/** Resolve and cancel ask for confirmation. Accept and open chat do not. */
export function ticketActionNeedsConfirm(
  action: TicketCardAction,
): action is "resolve" | "cancel" {
  return action === "resolve" || action === "cancel";
}

/**
 * Primary shortcut and overflow menu for one ticket card.
 * Open chat sits in the menu with resolve and cancel.
 */
export function ticketCardActions(
  role: UserTypeEnum,
  ticket: TicketActionSource,
): TicketCardActionSet {
  const menu = (actions: TicketCardAction[]): TicketCardAction[] =>
    ticketHasChat(ticket) ? ["open_chat", ...actions] : actions;

  if (role === UserTypeEnum.SUPPORT) {
    if (ticket.status === TicketStatusEnum.OPEN) {
      return { primary: "accept", menu: [] };
    }

    if (ticket.status === TicketStatusEnum.IN_PROGRESS) {
      return { primary: null, menu: menu(["resolve", "cancel"]) };
    }

    return { primary: null, menu: menu([]) };
  }

  if (!OWNER_ROLES.has(role)) {
    return { primary: null, menu: [] };
  }

  if (ticket.status === TicketStatusEnum.OPEN) {
    return { primary: null, menu: ["cancel"] };
  }

  if (ticket.status === TicketStatusEnum.IN_PROGRESS) {
    return { primary: null, menu: menu(["cancel"]) };
  }

  return { primary: null, menu: menu([]) };
}
