"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import {
  TicketCardAction,
  ticketActionNeedsConfirm,
  ticketCardActions,
  ticketChatPath,
} from "@/lib/helpers/ticket-actions";
import { useTicketTransition } from "@/lib/hooks/use-ticket-transition";
import { Ticket } from "@/lib/models/ticket";
import { cn } from "@/lib/utils/cn";
import { EllipsisVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Swal from "sweetalert2";

type TicketCardActionsProps = {
  ticket: Ticket;
  viewerType: UserTypeEnum;
};

function actionSlot(action: TicketCardAction): string {
  return `ticket-action-${action.replace(/_/g, "-")}`;
}

export default function TicketCardActions({
  ticket,
  viewerType,
}: TicketCardActionsProps) {
  const t = useTranslations("home");
  const sharedT = useTranslations("shared");
  const router = useRouter();
  const { pending, run } = useTicketTransition();
  const [menuOpen, setMenuOpen] = useState(false);

  const { primary, menu } = ticketCardActions(viewerType, ticket);

  const label = (action: TicketCardAction) =>
    action === "cancel" ? t("cancel_ticket") : t(action);

  const onAction = async (action: TicketCardAction) => {
    setMenuOpen(false);

    if (ticketActionNeedsConfirm(action)) {
      const response = await Swal.fire({
        theme: "auto",
        icon: "warning",
        showCancelButton: true,
        cancelButtonColor: "#d33",
        confirmButtonColor: "#3085d6",
        title: t(`${action}_title`),
        text: t(`${action}_description`),
        cancelButtonText: sharedT("cancel"),
        confirmButtonText: sharedT("confirm"),
      });

      if (!response?.isConfirmed) return;

      await run(ticket.id, action);
      return;
    }

    if (action === "open_chat") {
      router.push(ticketChatPath(ticket.id));
      return;
    }

    await run(ticket.id, action);
  };

  if (!primary && menu.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {primary ? (
        <button
          type="button"
          disabled={pending}
          data-slot={actionSlot(primary)}
          onClick={() => void onAction(primary)}
          className="inline-flex cursor-pointer items-center gap-1 text-xs text-primary disabled:opacity-50"
        >
          {pending && primary === "accept" ? (
            <Spinner className="size-3" />
          ) : null}
          {label(primary)}
        </button>
      ) : null}

      {menu.length > 0 ? (
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={pending}
              data-slot="ticket-actions"
              aria-label={t("ticket_actions")}
              className="inline-flex cursor-pointer items-center text-muted-foreground"
            >
              <EllipsisVertical size={18} />
            </button>
          </PopoverTrigger>

          <PopoverContent align="end" className="w-44 gap-1 p-1">
            {menu.map((action) => (
              <Button
                key={action}
                size="sm"
                type="button"
                variant="ghost"
                data-slot={actionSlot(action)}
                onClick={() => void onAction(action)}
                className={cn(
                  "h-8 w-full cursor-pointer justify-start rounded-lg px-2 font-normal",
                  action === "cancel" &&
                    "text-destructive hover:text-destructive",
                )}
              >
                {label(action)}
              </Button>
            ))}
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
}
