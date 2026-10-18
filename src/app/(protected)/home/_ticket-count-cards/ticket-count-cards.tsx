"use client";

import { TicketStatusEnum } from "@/lib/enums/ticket-status.enum";
import { TicketCounts } from "@/lib/models/ticket";
import { cn } from "@/lib/utils/cn";
import { statusCardMeta } from "@/lib/utils/status-card-meta";
import { Tickets, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

type CountCardLabel = "all" | "open" | "in_progress" | "resolved" | "cancelled";

type CountCard = {
  id: CountCardLabel;
  count: number;
  class: string;
  icon: LucideIcon;
  status: TicketStatusEnum | null;
  label: CountCardLabel;
};

const countCardStatuses = [
  TicketStatusEnum.OPEN,
  TicketStatusEnum.IN_PROGRESS,
  TicketStatusEnum.RESOLVED,
  TicketStatusEnum.CANCELLED,
] as const;

const allCardMeta = {
  class:
    "bg-[#615f82] [--ticket-ring:color-mix(in_srgb,#615f82_55%,white)] dark:bg-[#3e3c66] dark:[--ticket-ring:color-mix(in_srgb,#3e3c66_55%,white)]",
  icon: Tickets,
} as const;

function buildCountCards(
  counts: TicketCounts,
  isSupport: boolean,
): CountCard[] {
  const statuses = countCardStatuses.map((status) => {
    const meta = statusCardMeta[status];
    const label = status.toLowerCase() as CountCardLabel;

    return {
      id: label,
      label,
      status,
      icon: meta.icon,
      class: meta.class,
      count: counts[meta.type],
    };
  });

  if (isSupport) return statuses;

  return [
    {
      id: "all",
      label: "all",
      status: null,
      icon: allCardMeta.icon,
      class: allCardMeta.class,
      count: counts.all,
    },
    ...statuses,
  ];
}

type TicketCountCardsProps = {
  counts: TicketCounts;
  isSupport: boolean;
  className?: string;
  status: TicketStatusEnum | null;
  onStatusChange: (status: TicketStatusEnum | null) => void;
};

export default function TicketCountCards({
  counts,
  status,
  isSupport,
  className,
  onStatusChange,
}: TicketCountCardsProps) {
  const t = useTranslations("home");
  const cards = buildCountCards(counts, isSupport);

  return (
    <div
      data-slot="ticket-count-cards"
      className={cn(
        "grid grid-cols-2 content-start gap-4 md:gap-6 pt-1",
        className,
      )}
    >
      {cards.map((card) => {
        const Icon = card.icon;
        const selected = status === card.status;

        return (
          <button
            key={card.id}
            type="button"
            aria-pressed={selected}
            data-slot={`ticket-count-${card.id}`}
            onClick={() => onStatusChange(card.status)}
            className={cn(
              "cursor-pointer rounded-lg px-4 py-3 text-left transition-shadow duration-300 ease-out",
              card.class,
              card.id === "all" && "col-span-2",
              selected ? "ticket-count-selected" : "ring-1 ring-foreground/10",
            )}
          >
            <div className="mb-5 w-fit rounded-lg bg-black/25 p-4">
              <Icon size={24} />
            </div>

            <p className="text-sm font-medium">{t(card.label)} Supports</p>

            <span
              className="text-2xl font-medium"
              data-slot={`ticket-count-value-${card.id}`}
            >
              {card.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
