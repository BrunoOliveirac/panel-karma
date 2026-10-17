import { renderWithProvidersAsync } from "@/lib/mocks/render-with-providers.mock";
import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import { TicketStatusEnum } from "@/lib/enums/ticket-status.enum";
import {
  mockLoggedUser,
  setMockLoggedUser,
} from "@/lib/mocks/logged-user.mock";
import { Ticket, TicketCounts, TicketStreamEvent } from "@/lib/models/ticket";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import Home from "./home";

const listTicketsMock = jest.fn();
const countTicketsMock = jest.fn();

let streamListener: ((event: TicketStreamEvent) => void) | null = null;
let resyncListener: (() => void) | null = null;

jest.mock("use-intl", () => {
  const translate = (key: string) => key;
  return { useTranslations: () => translate };
});

jest.mock("next-intl", () => {
  const translate = (key: string) => key;
  return {
    useTranslations: () => translate,
    useLocale: () => "en",
    useFormatter: () => ({
      dateTime: (value: Date) => value.toISOString().slice(0, 10),
    }),
  };
});

jest.mock("@/lib/hooks/use-ticket-stream", () => ({
  useTicketStream: () => ({
    subscribeToTicket: (listener: (event: TicketStreamEvent) => void) => {
      streamListener = listener;
      return () => {
        streamListener = null;
      };
    },
    subscribeToResync: (listener: () => void) => {
      resyncListener = listener;
      return () => {
        resyncListener = null;
      };
    },
  }),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("sweetalert2", () => ({
  __esModule: true,
  default: { fire: jest.fn() },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/services/ticket.service", () => ({
  TicketService: jest.fn().mockImplementation(() => ({
    listTickets: (...args: unknown[]) => listTicketsMock(...args),
    countTickets: (...args: unknown[]) => countTicketsMock(...args),
  })),
}));

function ticket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: "t1",
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    title: "Printer",
    description: "Paper jam",
    status: TicketStatusEnum.OPEN,
    userId: mockLoggedUser.id,
    userName: "Ana Costa",
    userAvatar: null,
    supportId: null,
    supportName: null,
    supportAvatar: null,
    ...overrides,
  };
}

describe("Home", () => {
  let view: Awaited<ReturnType<typeof renderWithProvidersAsync>> | undefined;

  beforeEach(() => {
    streamListener = null;
    resyncListener = null;
    countTicketsMock.mockResolvedValue({
      open: 1,
      inProgress: 1,
      resolved: 0,
      cancelled: 0,
      all: 2,
    });
    listTicketsMock.mockResolvedValue({
      items: [ticket()],
      totalPages: 2,
      total: 2,
    });
  });

  afterEach(() => {
    view?.unmount();
    view = undefined;
    setMockLoggedUser();
  });

  it("loads counts once and requests the next page without recounting", async () => {
    view = await renderWithProvidersAsync(<Home />);

    expect(await screen.findByText("Paper jam")).toBeInTheDocument();
    expect(screen.getByTestId("ticket-user")).toHaveTextContent("Ana Costa");
    expect(screen.getByText("assignee:")).toBeInTheDocument();
    expect(screen.queryByTestId("ticket-support")).not.toBeInTheDocument();
    expect(countTicketsMock).toHaveBeenCalledTimes(1);
    expect(listTicketsMock).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 5, status: null }),
    );

    fireEvent.click(screen.getByTestId("pagination-link-2"));

    await waitFor(() => {
      expect(listTicketsMock).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 }),
      );
    });
    expect(countTicketsMock).toHaveBeenCalledTimes(1);
  });

  it("updates the listed ticket and the counters from the stream", async () => {
    view = await renderWithProvidersAsync(<Home />);
    expect(await screen.findByText("Paper jam")).toBeInTheDocument();
    expect(
      screen.getByTestId("ticket-count-value-in_progress"),
    ).toHaveTextContent("1");

    const callsBefore = listTicketsMock.mock.calls.length;

    await act(async () => {
      streamListener?.({
        previousStatus: TicketStatusEnum.OPEN,
        ticket: ticket({
          status: TicketStatusEnum.IN_PROGRESS,
          supportId: "s1",
          supportName: "Bruno Lima",
          supportAvatar: null,
          updatedAt: "2026-01-03T00:00:00.000Z",
        }),
      });
    });

    expect(screen.getByTestId("ticket-count-value-all")).toHaveTextContent("2");
    expect(screen.getByTestId("ticket-count-value-open")).toHaveTextContent(
      "0",
    );
    expect(
      screen.getByTestId("ticket-count-value-in_progress"),
    ).toHaveTextContent("2");
    expect(screen.getByTestId("ticket-card")).toHaveTextContent("in_progress");
    expect(screen.getByTestId("ticket-support")).toHaveTextContent(
      "Bruno Lima",
    );
    expect(listTicketsMock).toHaveBeenCalledTimes(callsBefore);
    expect(countTicketsMock).toHaveBeenCalledTimes(1);
  });

  it("reloads the list when a new ticket arrives and does not recount", async () => {
    view = await renderWithProvidersAsync(<Home />);
    expect(await screen.findByText("Paper jam")).toBeInTheDocument();

    const callsBefore = listTicketsMock.mock.calls.length;
    listTicketsMock.mockResolvedValue({
      items: [
        ticket({
          id: "t2",
          title: "New ticket",
          description: "Arrived from the stream",
        }),
        ticket(),
      ],
      totalPages: 1,
      total: 2,
    });

    await act(async () => {
      streamListener?.({
        previousStatus: null,
        ticket: ticket({
          id: "t2",
          title: "New ticket",
          description: "Arrived from the stream",
          updatedAt: "2026-01-03T00:00:00.000Z",
        }),
      });
    });

    expect(await screen.findByText("New ticket")).toBeInTheDocument();
    expect(screen.getByTestId("ticket-count-value-open")).toHaveTextContent(
      "2",
    );
    expect(screen.getByTestId("ticket-count-value-all")).toHaveTextContent("3");
    expect(listTicketsMock).toHaveBeenCalledTimes(callsBefore + 1);
    expect(countTicketsMock).toHaveBeenCalledTimes(1);
  });

  it("filters the user list from the count cards", async () => {
    view = await renderWithProvidersAsync(<Home />);

    expect(await screen.findByText("Paper jam")).toBeInTheDocument();
    expect(screen.getByTestId("ticket-count-all")).toBeInTheDocument();
    expect(screen.getByTestId("ticket-count-open")).toBeInTheDocument();
    expect(screen.getByTestId("ticket-count-value-open")).toHaveTextContent(
      "1",
    );
    expect(screen.getByTestId("ticket-count-all")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByTestId("ticket-count-open"));

    await waitFor(() => {
      expect(listTicketsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          status: TicketStatusEnum.OPEN,
        }),
      );
    });
    expect(screen.getByTestId("ticket-count-open")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByTestId("ticket-count-all"));

    await waitFor(() => {
      expect(listTicketsMock).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, status: null }),
      );
    });
  });

  it("opens the support home on the shared open queue", async () => {
    setMockLoggedUser({
      ...mockLoggedUser,
      id: "s1",
      type: UserTypeEnum.SUPPORT,
    });
    listTicketsMock.mockResolvedValue({
      items: [
        ticket({
          supportId: "s1",
          supportName: "Bruno Lima",
          acceptedAt: "2026-01-02T00:00:00.000Z",
          finishedAt: "2026-01-03T00:00:00.000Z",
        }),
      ],
      totalPages: 1,
      total: 1,
    });

    view = await renderWithProvidersAsync(<Home />);

    await waitFor(() => {
      expect(listTicketsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          status: TicketStatusEnum.OPEN,
        }),
      );
    });
    expect(screen.getByTestId("ticket-count-open")).toBeInTheDocument();
    expect(screen.getByTestId("ticket-count-value-open")).toHaveTextContent(
      "1",
    );
    expect(screen.queryByTestId("ticket-count-all")).not.toBeInTheDocument();
    expect(screen.queryByText("assignee:")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ticket-support")).not.toBeInTheDocument();
    expect(screen.getByText("assignee_date:")).toBeInTheDocument();
    expect(screen.getByText("completion_date:")).toBeInTheDocument();
  });

  it("applies a queued event only after the first counts and list finish", async () => {
    let resolveCounts: (counts: TicketCounts) => void = () => undefined;
    let resolveList: (response: {
      items: Ticket[];
      totalPages: number;
      total: number;
    }) => void = () => undefined;

    countTicketsMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCounts = resolve;
        }),
    );
    listTicketsMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveList = resolve;
        }),
    );

    view = await renderWithProvidersAsync(<Home />);
    expect(streamListener).toEqual(expect.any(Function));

    await act(async () => {
      streamListener?.({
        previousStatus: null,
        ticket: ticket({
          id: "t2",
          title: "Queued",
          description: "Queued",
          updatedAt: "2026-01-03T00:00:00.000Z",
        }),
      });
    });

    expect(listTicketsMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveCounts({
        open: 1,
        inProgress: 0,
        resolved: 0,
        cancelled: 0,
        all: 1,
      });
    });

    expect(screen.getByTestId("ticket-count-value-open")).toHaveTextContent(
      "1",
    );
    expect(listTicketsMock).toHaveBeenCalledTimes(1);

    listTicketsMock.mockResolvedValue({
      items: [ticket({ id: "t2", title: "Queued", description: "Queued" })],
      totalPages: 1,
      total: 1,
    });

    await act(async () => {
      resolveList({ items: [ticket()], totalPages: 1, total: 1 });
    });

    await waitFor(() => {
      expect(listTicketsMock).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByTestId("ticket-count-value-open")).toHaveTextContent(
      "2",
    );
    expect(screen.getByTestId("ticket-count-value-all")).toHaveTextContent("2");
    expect(countTicketsMock).toHaveBeenCalledTimes(1);
  });

  it("ignores a repeated status and leaves the counters untouched", async () => {
    view = await renderWithProvidersAsync(<Home />);
    expect(await screen.findByText("Paper jam")).toBeInTheDocument();

    const callsBefore = listTicketsMock.mock.calls.length;

    await act(async () => {
      streamListener?.({
        previousStatus: TicketStatusEnum.OPEN,
        ticket: ticket({ title: "Stale title", description: "Stale body" }),
      });
    });

    expect(screen.getByText("Paper jam")).toBeInTheDocument();
    expect(screen.queryByText("Stale title")).not.toBeInTheDocument();
    expect(screen.getByTestId("ticket-count-value-open")).toHaveTextContent(
      "1",
    );
    expect(screen.getByTestId("ticket-count-value-all")).toHaveTextContent("2");
    expect(listTicketsMock).toHaveBeenCalledTimes(callsBefore);
    expect(countTicketsMock).toHaveBeenCalledTimes(1);
  });

  it("updates the counters without reloading when the event stays off the filter", async () => {
    view = await renderWithProvidersAsync(<Home />);
    expect(await screen.findByText("Paper jam")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("ticket-count-resolved"));

    await waitFor(() => {
      expect(listTicketsMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: TicketStatusEnum.RESOLVED }),
      );
    });

    const callsBefore = listTicketsMock.mock.calls.length;

    await act(async () => {
      streamListener?.({
        previousStatus: null,
        ticket: ticket({
          id: "t2",
          title: "Still open",
          description: "Still open",
          updatedAt: "2026-01-03T00:00:00.000Z",
        }),
      });
    });

    expect(screen.queryByText("Still open")).not.toBeInTheDocument();
    expect(screen.getByTestId("ticket-count-value-open")).toHaveTextContent(
      "2",
    );
    expect(screen.getByTestId("ticket-count-value-all")).toHaveTextContent("3");
    expect(listTicketsMock).toHaveBeenCalledTimes(callsBefore);
    expect(countTicketsMock).toHaveBeenCalledTimes(1);
  });

  it("reloads counts and the list when the stream reconnects", async () => {
    view = await renderWithProvidersAsync(<Home />);
    expect(await screen.findByText("Paper jam")).toBeInTheDocument();
    expect(resyncListener).toEqual(expect.any(Function));

    const listCalls = listTicketsMock.mock.calls.length;
    const countCalls = countTicketsMock.mock.calls.length;

    await act(async () => {
      resyncListener?.();
    });

    await waitFor(() => {
      expect(listTicketsMock).toHaveBeenCalledTimes(listCalls + 1);
      expect(countTicketsMock).toHaveBeenCalledTimes(countCalls + 1);
    });
  });

  it("trims the search and resets the page", async () => {
    view = await renderWithProvidersAsync(<Home />);
    expect(await screen.findByText("Paper jam")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("pagination-link-2"));

    await waitFor(() => {
      expect(listTicketsMock).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 }),
      );
    });

    fireEvent.change(screen.getByTestId("ticket-search"), {
      target: { value: "  printer  " },
    });

    await waitFor(() => {
      expect(listTicketsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, query: "printer" }),
      );
    });
  });
});
