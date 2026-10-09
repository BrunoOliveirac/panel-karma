"use client";

import { TicketService } from "@/lib/services/ticket.service";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { TicketTransition } from "../helpers/ticket-actions";

const successKey = {
  accept: "ticket_accepted",
  resolve: "ticket_resolved",
  cancel: "ticket_cancelled",
} as const;

const errorKey = {
  accept: "could_not_accept",
  resolve: "could_not_resolve",
  cancel: "could_not_cancel",
} as const;

/**
 * Accept, resolve, or cancel a ticket.
 * The home list and the chat share this call, including the toasts.
 */
export function useTicketTransition() {
  const t = useTranslations("home");
  const ticketService = useMemo(() => new TicketService(), []);
  const [pending, setPending] = useState(false);

  const run = useCallback(
    async (ticketId: string, action: TicketTransition): Promise<boolean> => {
      setPending(true);

      try {
        if (action === "accept") await ticketService.acceptTicket(ticketId);
        if (action === "resolve") await ticketService.resolveTicket(ticketId);
        if (action === "cancel") await ticketService.cancelTicket(ticketId);

        toast.success(t(successKey[action]));
        return true;
      } catch (error) {
        console.error(error);
        toast.error(t(errorKey[action]));
        return false;
      } finally {
        setPending(false);
      }
    },
    [t, ticketService],
  );

  return { pending, run };
}
