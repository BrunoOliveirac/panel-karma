import { TicketStatusEnum } from "../enums/ticket-status.enum";
import { UserTypeEnum } from "../enums/user-type.enum";

export type TicketCardAction = "accept" | "open_chat" | "resolve" | "cancel";

export type TicketTransition = "accept" | "resolve" | "cancel";

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
 * Every card action lives in the vertical ellipsis.
 * Open chat sits with resolve and cancel when a conversation exists.
 */
export function ticketCardActions(
  role: UserTypeEnum,
  ticket: TicketActionSource,
): TicketCardAction[] {
  const menu = (actions: TicketCardAction[]): TicketCardAction[] =>
    ticketHasChat(ticket) ? ["open_chat", ...actions] : actions;

  if (role === UserTypeEnum.SUPPORT) {
    if (ticket.status === TicketStatusEnum.OPEN) {
      return ["accept"];
    }

    if (ticket.status === TicketStatusEnum.IN_PROGRESS) {
      return menu(["resolve", "cancel"]);
    }

    return menu([]);
  }

  if (!OWNER_ROLES.has(role)) {
    return [];
  }

  if (ticket.status === TicketStatusEnum.OPEN) {
    return ["cancel"];
  }

  if (ticket.status === TicketStatusEnum.IN_PROGRESS) {
    return menu(["cancel"]);
  }

  return menu([]);
}
