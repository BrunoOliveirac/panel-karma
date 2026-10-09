"use client";

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
import { browserTimeZone } from "@/lib/utils/calendar-day";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import TicketCountCards from "./_ticket-count-cards/ticket-count-cards";
import TicketFilters from "./_ticket-filters/ticket-filters";
import TicketList from "./_ticket-list/ticket-list";

const emptyCounts: TicketCounts = {
  open: 0,
  inProgress: 0,
  resolved: 0,
  cancelled: 0,
  all: 0,
};

export default function Home() {
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
        timeZone: startDate || endDate ? browserTimeZone() : undefined,
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
          browserTimeZone(),
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

  if (!user) return null;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-1">
      <div className="grid gap-4 pb-6 md:h-full md:min-h-112 md:grid-cols-2 md:gap-6">
        <div className="contents md:flex md:min-h-0 md:flex-col md:gap-6 md:overflow-hidden">
          <TicketFilters
            search={search}
            endDate={endDate}
            startDate={startDate}
            onSearchChange={(value) => {
              setSearch(value);
              debouncedSetQuery(value);
            }}
            onPeriodChange={(nextStart, nextEnd) => {
              setPage(1);
              setStartDate(nextStart);
              setEndDate(nextEnd);
            }}
          />

          <TicketList
            page={page}
            tickets={tickets}
            isLoading={isLoading}
            totalPages={totalPages}
            viewerType={user.type}
            className="max-md:order-3"
            onPageChange={setPage}
          />
        </div>

        <TicketCountCards
          counts={counts}
          status={status}
          isSupport={isSupport}
          className="max-md:order-2"
          onStatusChange={(nextStatus) => {
            setPage(1);
            setStatus(nextStatus);
          }}
        />
      </div>
    </div>
  );
}
