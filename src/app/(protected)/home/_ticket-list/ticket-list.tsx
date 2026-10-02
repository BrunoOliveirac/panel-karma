"use client";

import PaginationControls from "@/components/global/pagination-controls";
import { Spinner } from "@/components/ui/spinner";
import { formatTicketCode } from "@/lib/helpers/merge-ticket";
import { Ticket } from "@/lib/models/ticket";
import { cn } from "@/lib/utils/cn";
import { parseISO } from "date-fns";
import { useFormatter, useTranslations } from "next-intl";

type TicketListProps = {
  page: number;
  tickets: Ticket[];
  isLoading: boolean;
  totalPages: number;
  className?: string;
  onPageChange: (page: number) => void;
};

export default function TicketList({
  page,
  tickets,
  isLoading,
  className,
  totalPages,
  onPageChange,
}: TicketListProps) {
  const format = useFormatter();
  const t = useTranslations("home");

  return (
    <div
      data-slot="ticket-list"
      className={cn("flex flex-col gap-4", className)}
    >
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : tickets.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          {t("tickets_not_found")}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {tickets.map((ticket) => (
            <article
              key={ticket.id}
              data-slot="ticket-card"
              className="rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-medium">
                  {ticket.code ? `#${formatTicketCode(ticket.code)} ` : ""}
                  {ticket.title}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {t(ticket.status.toLowerCase())}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {ticket.description}
              </p>
              {ticket.createdAt ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {format.dateTime(parseISO(ticket.createdAt), {
                    dateStyle: "short",
                  })}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <PaginationControls
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      ) : null}
    </div>
  );
}
