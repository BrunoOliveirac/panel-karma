"use client";

import PaginationControls from "@/components/global/pagination-controls";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { TicketStatusEnum } from "@/lib/enums/ticket-status.enum";
import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import {
  applyTicketCountDelta,
  resolvePreviousStatus,
  shouldIgnoreTicketEvent,
  ticketChangesFilteredSet,
  updateListedTicket,
} from "@/lib/helpers/merge-ticket";
import { useTicketStream } from "@/lib/hooks/use-ticket-stream";
import { Ticket, TicketCounts, TicketStreamEvent } from "@/lib/models/ticket";
import { TicketService } from "@/lib/services/ticket.service";
import { useLoggedUserStore } from "@/lib/store/use-logged-user-store";
import { useTitle } from "@/lib/store/use-title-store";
import { cn } from "@/lib/utils/cn";
import { parseISO } from "date-fns";
import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

const emptyCounts: TicketCounts = {
  all: 0,
  inProgress: 0,
  resolved: 0,
  cancelled: 0,
};

const statusLabel: Record<
  TicketStatusEnum,
  "open" | "in_progress" | "resolved" | "cancelled"
> = {
  [TicketStatusEnum.OPEN]: "open",
  [TicketStatusEnum.IN_PROGRESS]: "in_progress",
  [TicketStatusEnum.RESOLVED]: "resolved",
  [TicketStatusEnum.CANCELLED]: "cancelled",
};

type CountCard = {
  id: string;
  label: "all" | "open" | "in_progress" | "resolved" | "cancelled";
  status: TicketStatusEnum | null;
  count: number;
};

export default function Home() {
  const format = useFormatter();
  const t = useTranslations("home");
  const setTitle = useTitle((state) => state.setTitle);
  const user = useLoggedUserStore((state) => state.user);
  const ticketService = useMemo(() => new TicketService(), []);
  const { subscribeToTicket, subscribeToResync } = useTicketStream();

  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const boot = useRef({ counts: false, list: false });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [counts, setCounts] = useState<TicketCounts>(emptyCounts);

  const [status, setStatus] = useState<TicketStatusEnum | null>(() =>
    useLoggedUserStore.getState().user?.type === UserTypeEnum.SUPPORT
      ? TicketStatusEnum.OPEN
      : null,
  );

  const booted = useRef(false);
  const listRequestRef = useRef(0);
  const countsRequestRef = useRef(0);
  const ticketsRef = useRef<Ticket[]>([]);
  const queueRef = useRef<TicketStreamEvent[]>([]);

  const applyEventRef = useRef<(event: TicketStreamEvent) => void>(
    () => undefined,
  );

  const isSupport = user?.type === UserTypeEnum.SUPPORT;

  const debouncedSetQuery = useDebouncedCallback((value: string) => {
    setPage(1);
    setQuery(value.trim());
  }, 300);

  const flushQueue = useCallback(() => {
    if (!boot.current.counts || !boot.current.list || booted.current) return;

    booted.current = true;
    queueRef.current.splice(0).forEach((event) => applyEventRef.current(event));
  }, []);

  const loadCounts = useCallback(async () => {
    if (!user) return;

    const requestId = ++countsRequestRef.current;

    try {
      const next = await ticketService.countTickets();
      if (requestId !== countsRequestRef.current) return;
      setCounts(next);
    } catch (error) {
      console.error(error);
    } finally {
      if (requestId === countsRequestRef.current) {
        boot.current.counts = true;
        flushQueue();
      }
    }
  }, [flushQueue, ticketService, user]);

  const loadList = useCallback(async () => {
    if (!user) return;

    const requestId = ++listRequestRef.current;
    setIsLoading(true);

    try {
      const response = await ticketService.listTickets({
        page,
        query,
        status,
        pageSize: 5,
        endDate: endDate || undefined,
        startDate: startDate || undefined,
      });

      if (requestId !== listRequestRef.current) return;

      ticketsRef.current = response.items;
      setTickets(response.items);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      if (requestId === listRequestRef.current) {
        setIsLoading(false);
        boot.current.list = true;
        flushQueue();
      }
    }
  }, [
    endDate,
    flushQueue,
    page,
    query,
    startDate,
    status,
    ticketService,
    user,
  ]);

  const applyEvent = useCallback(
    (event: TicketStreamEvent) => {
      if (!user) return;

      const listed = ticketsRef.current.find(
        (item) => item.id === event.ticket.id,
      );

      if (shouldIgnoreTicketEvent(event.ticket, listed)) return;

      const previous = resolvePreviousStatus(event.previousStatus, listed);

      setCounts((current) =>
        applyTicketCountDelta(
          current,
          user.type,
          user.id,
          previous,
          event.ticket,
        ),
      );

      if (
        ticketChangesFilteredSet(
          ticketsRef.current,
          event.ticket,
          user.type,
          user.id,
          status,
          query,
          startDate,
          endDate,
        )
      ) {
        loadList();
        return;
      }

      const nextTickets = updateListedTicket(
        ticketsRef.current,
        event.ticket,
        user.type,
        user.id,
        status,
        query,
      );

      ticketsRef.current = nextTickets;
      setTickets(nextTickets);
    },
    [endDate, loadList, query, startDate, status, user],
  );

  applyEventRef.current = applyEvent;

  useEffect(() => {
    document.title = `${t("home")} | Karma`;
    setTitle(t("home"));
  }, [setTitle, t]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    return subscribeToTicket((event) => {
      if (!booted.current) {
        queueRef.current.push(event);
        return;
      }

      applyEventRef.current(event);
    });
  }, [subscribeToTicket]);

  useEffect(() => {
    return subscribeToResync(() => {
      loadCounts();
      loadList();
    });
  }, [loadCounts, loadList, subscribeToResync]);

  const cards: CountCard[] = isSupport
    ? [
        {
          id: "open",
          label: "open",
          status: TicketStatusEnum.OPEN,
          count: counts.all,
        },
        {
          id: "in_progress",
          label: "in_progress",
          status: TicketStatusEnum.IN_PROGRESS,
          count: counts.inProgress,
        },
        {
          id: "resolved",
          label: "resolved",
          status: TicketStatusEnum.RESOLVED,
          count: counts.resolved,
        },
        {
          id: "cancelled",
          label: "cancelled",
          status: TicketStatusEnum.CANCELLED,
          count: counts.cancelled,
        },
      ]
    : [
        { id: "all", label: "all", status: null, count: counts.all },
        {
          id: "in_progress",
          label: "in_progress",
          status: TicketStatusEnum.IN_PROGRESS,
          count: counts.inProgress,
        },
        {
          id: "resolved",
          label: "resolved",
          status: TicketStatusEnum.RESOLVED,
          count: counts.resolved,
        },
        {
          id: "cancelled",
          label: "cancelled",
          status: TicketStatusEnum.CANCELLED,
          count: counts.cancelled,
        },
      ];

  if (!user) return null;

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            data-slot={`ticket-count-${card.id}`}
            onClick={() => {
              setPage(1);
              setStatus(card.status);
            }}
            className={cn(
              "rounded-2xl bg-card px-4 py-3 text-left ring-1 ring-foreground/10",
              status === card.status && "ring-2 ring-primary",
            )}
          >
            <span className="block text-sm text-muted-foreground">
              {t(card.label)}
            </span>
            <span
              data-slot={`ticket-count-value-${card.id}`}
              className="text-2xl font-medium"
            >
              {card.count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          value={search}
          data-slot="ticket-search"
          placeholder={t("search")}
          onChange={(event) => {
            setSearch(event.target.value);
            debouncedSetQuery(event.target.value);
          }}
        />
        <Input
          type="date"
          value={startDate}
          data-slot="ticket-start-date"
          aria-label={t("start_date")}
          onChange={(event) => {
            setPage(1);
            setStartDate(event.target.value);
          }}
        />
        <Input
          type="date"
          value={endDate}
          data-slot="ticket-end-date"
          aria-label={t("end_date")}
          onChange={(event) => {
            setPage(1);
            setEndDate(event.target.value);
          }}
        />
      </div>

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
                  {ticket.code ? `#${ticket.code} ` : ""}
                  {ticket.title}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {t(statusLabel[ticket.status])}
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
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}
