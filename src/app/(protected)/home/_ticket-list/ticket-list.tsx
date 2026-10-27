"use client";

import PaginationControls from "@/components/global/pagination-controls/pagination-controls";
import UserAvatar from "@/components/global/user-avatar/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import { formatTicketCode } from "@/lib/helpers/merge-ticket";
import { Ticket } from "@/lib/models/ticket";
import { cn } from "@/lib/utils/cn";
import { statusCardMeta } from "@/lib/utils/status-card-meta";
import { parseISO } from "date-fns";
import { useFormatter, useTranslations } from "next-intl";
import TicketCardActions from "./ticket-card-actions";

type TicketListProps = {
  page: number;
  tickets: Ticket[];
  isLoading: boolean;
  totalPages: number;
  viewerType: UserTypeEnum;
  className?: string;
  onPageChange: (page: number) => void;
};

export default function TicketList({
  page,
  tickets,
  isLoading,
  className,
  totalPages,
  viewerType,
  onPageChange,
}: TicketListProps) {
  const format = useFormatter();
  const t = useTranslations("home");

  return (
    <div
      data-slot="ticket-list"
      className={cn(
        "flex min-h-0 flex-col gap-4 md:flex-1 md:overflow-hidden",
        className,
      )}
    >
      <div className="overflow-y-auto max-md:max-h-[min(24rem,70dvh)] md:min-h-0 md:flex-1">
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
                className="rounded-lg bg-card px-4 py-3 ring-1 ring-foreground/10"
              >
                <div className="flex justify-between">
                  <div data-slot="ticket-user" className="flex gap-2">
                    <UserAvatar
                      size={28}
                      avatar={ticket.userAvatar}
                      name={ticket.userName ?? ""}
                    />

                    <div>
                      <h4 className="truncate">
                        {ticket.userName}

                        <span className="text-muted-foreground">
                          {" - "}

                          {ticket.code
                            ? `#${formatTicketCode(ticket.code)} `
                            : ""}
                        </span>
                      </h4>

                      <p className="text-[10px] text-muted-foreground">
                        {format.dateTime(parseISO(ticket.createdAt), {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Badge
                      className={cn(
                        "shrink-0 text-xs rounded",
                        statusCardMeta[ticket.status].class,
                      )}
                    >
                      {t(ticket.status.toLowerCase())}
                    </Badge>

                    <TicketCardActions
                      ticket={ticket}
                      viewerType={viewerType}
                    />
                  </div>
                </div>

                <p className="mt-2 text-sm line-clamp-4">{ticket.title}</p>

                <p className="mt-2 text-xs text-muted-foreground line-clamp-4">
                  {ticket.description}
                </p>

                <Separator className="my-2 bg-muted-foreground" />

                <div
                  className={cn(
                    "grid *:flex *:flex-col *:justify-center *:items-center gap-3",
                    viewerType === UserTypeEnum.SUPPORT
                      ? "grid-cols-2"
                      : "grid-cols-3",
                  )}
                >
                  {viewerType === UserTypeEnum.SUPPORT ? null : (
                    <div className="text-sm md:text-xs lg:text-sm">
                      <p className="text-muted-foreground mb-1">
                        {t("assignee")}:
                      </p>

                      {ticket.supportId ? (
                        <div
                          data-slot="ticket-support"
                          className="flex items-center gap-2"
                        >
                          <UserAvatar
                            size={28}
                            avatar={ticket.supportAvatar}
                            name={ticket.supportName ?? ""}
                          />

                          <p>{ticket.supportName}</p>
                        </div>
                      ) : (
                        "-"
                      )}
                    </div>
                  )}

                  <div className="text-sm md:text-xs lg:text-sm">
                    <p className="text-muted-foreground mb-1">
                      {t("assignee_date")}:
                    </p>

                    {ticket.acceptedAt ? (
                      <p>
                        {format.dateTime(parseISO(ticket.acceptedAt), {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    ) : (
                      "-"
                    )}
                  </div>

                  <div className="text-sm md:text-xs lg:text-sm">
                    <p className="text-muted-foreground mb-1">
                      {t("completion_date")}:
                    </p>

                    {ticket.finishedAt ? (
                      <p>
                        {format.dateTime(parseISO(ticket.finishedAt), {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    ) : (
                      "-"
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0">
        <PaginationControls
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
