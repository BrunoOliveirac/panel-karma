"use client";

import { TicketStatusEnum } from "@/lib/enums/ticket-status.enum";
import { TicketCounts } from "@/lib/models/ticket";
import { cn } from "@/lib/utils/cn";
import {
  TicketCheck,
  Ticket as TicketIcon,
  Tickets,
  TicketsPlane,
  TicketX,
  type LucideIcon,
} from "lucide-react";
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

const statusCardMeta = {
  [TicketStatusEnum.OPEN]: {
    class: "bg-[#7c79d4] [--ticket-ring:color-mix(in_srgb,#7c79d4_55%,white)]",
    icon: TicketIcon,
    countKey: "open",
  },
  [TicketStatusEnum.IN_PROGRESS]: {
    class:
      "bg-[#2b7a9e] [--ticket-ring:color-mix(in_srgb,#2b7a9e_55%,white)] dark:bg-[#06638d] dark:[--ticket-ring:color-mix(in_srgb,#06638d_55%,white)]",
    icon: TicketsPlane,
    countKey: "inProgress",
  },
  [TicketStatusEnum.RESOLVED]: {
    class: "bg-[#2C695B] [--ticket-ring:color-mix(in_srgb,#2C695B_55%,white)]",
    icon: TicketCheck,
    countKey: "resolved",
  },
  [TicketStatusEnum.CANCELLED]: {
    class: "bg-[#C2C2C4] [--ticket-ring:color-mix(in_srgb,#C2C2C4_55%,white)]",
    icon: TicketX,
    countKey: "cancelled",
  },
} as const satisfies Record<
  TicketStatusEnum,
  {
    class: string;
    icon: LucideIcon;
    countKey: "open" | "inProgress" | "resolved" | "cancelled";
  }
>;

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
      count: counts[meta.countKey],
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
      className={cn("grid grid-cols-2 content-start gap-6 pt-1", className)}
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

            <p className="text-sm font-medium">{t(card.label)}</p>

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
