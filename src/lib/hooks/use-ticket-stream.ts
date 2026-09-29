"use client";

import { useEffect } from "react";
import { TicketStatusEnum } from "../enums/ticket-status.enum";
import { Ticket, TicketStreamEvent } from "../models/ticket";
import { useLoggedUserStore } from "../store/use-logged-user-store";

const ticketListeners = new Set<(event: TicketStreamEvent) => void>();
const resyncListeners = new Set<() => void>();

let eventSource: EventSource | null = null;
let hasOpened = false;

const TICKET_STATUSES = new Set<string>(Object.values(TicketStatusEnum));

function isTicket(value: unknown): value is Ticket {
  if (!value || typeof value !== "object") return false;

  const ticket = value as Record<string, unknown>;

  return (
    typeof ticket.id === "string" &&
    ticket.id.length > 0 &&
    typeof ticket.title === "string" &&
    typeof ticket.description === "string" &&
    typeof ticket.userId === "string" &&
    typeof ticket.status === "string" &&
    TICKET_STATUSES.has(ticket.status)
  );
}

function readPreviousStatus(
  source: Record<string, unknown>,
): TicketStatusEnum | null {
  return typeof source.previousStatus === "string" &&
    TICKET_STATUSES.has(source.previousStatus)
    ? (source.previousStatus as TicketStatusEnum)
    : null;
}

function parseStreamedTicket(data: string): TicketStreamEvent | null {
  if (!data?.trim()) return null;

  try {
    const parsed = JSON.parse(data) as unknown;
    if (!parsed || typeof parsed !== "object") return null;

    const candidate = parsed as Record<string, unknown>;
    const ticket = [candidate, candidate.ticket, candidate.data].find(isTicket);

    if (!ticket) return null;

    return {
      ticket: ticket as Ticket,
      previousStatus: readPreviousStatus(candidate),
    };
  } catch {
    return null;
  }
}

function handleStreamEvent(event: MessageEvent<string>) {
  const streamed = parseStreamedTicket(event.data);
  if (!streamed) return;

  ticketListeners.forEach((listener) => listener(streamed));
}

/**
 * The first open is the initial connection. Later opens are reconnects,
 * which do not replay events missed while the socket was down.
 */
function handleStreamOpen() {
  if (!hasOpened) {
    hasOpened = true;
    return;
  }

  resyncListeners.forEach((listener) => listener());
}

function startTicketStream() {
  if (eventSource) return;

  eventSource = new EventSource("/api/tickets/stream");
  eventSource.onmessage = handleStreamEvent;
  eventSource.onopen = handleStreamOpen;
  eventSource.addEventListener("ticket", handleStreamEvent);
}

function stopTicketSession() {
  eventSource?.close();
  eventSource = null;
  hasOpened = false;
}

function subscribeToTicket(listener: (event: TicketStreamEvent) => void) {
  ticketListeners.add(listener);
  return () => {
    ticketListeners.delete(listener);
  };
}

function subscribeToResync(listener: () => void) {
  resyncListeners.add(listener);
  return () => {
    resyncListeners.delete(listener);
  };
}

useLoggedUserStore.subscribe((state) => {
  if (!state.user) stopTicketSession();
});

/**
 * Keep a single ticket SSE connection for the session.
 * Events carry the ticket and the status it had before the change.
 */
export function useTicketStream() {
  const user = useLoggedUserStore((state) => state.user);

  useEffect(() => {
    if (!user) return;

    startTicketStream();
  }, [user]);

  return { subscribeToTicket, subscribeToResync };
}
