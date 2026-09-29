import { renderWithProvidersAsync } from "@/lib/mocks/render-with-providers.mock";
import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import { TicketStatusEnum } from "@/lib/enums/ticket-status.enum";
import {
  mockLoggedUser,
  setMockLoggedUser,
} from "@/lib/mocks/logged-user.mock";
import { Ticket, TicketStreamEvent } from "@/lib/models/ticket";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import Home from "./home";

const listTicketsMock = jest.fn();
const countTicketsMock = jest.fn();

let streamListener: ((event: TicketStreamEvent) => void) | null = null;

jest.mock("use-intl", () => {
  const translate = (key: string) => key;
  return { useTranslations: () => translate };
});

jest.mock("next-intl", () => {
  const translate = (key: string) => key;
  return {
    useTranslations: () => translate,
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
    subscribeToResync: () => () => undefined,
  }),
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
    supportId: null,
    ...overrides,
  };
}

describe("Home", () => {
  let view: Awaited<ReturnType<typeof renderWithProvidersAsync>> | undefined;

  beforeEach(() => {
    streamListener = null;
    countTicketsMock.mockResolvedValue({
      all: 2,
      inProgress: 1,
      resolved: 0,
      cancelled: 0,
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
  });

  it("loads counts once and requests the next page without recounting", async () => {
    view = await renderWithProvidersAsync(<Home />);

    expect(await screen.findByText("Printer")).toBeInTheDocument();
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
    expect(await screen.findByText("Printer")).toBeInTheDocument();
    expect(
      screen.getByTestId("ticket-count-value-in_progress"),
    ).toHaveTextContent("1");

    const callsBefore = listTicketsMock.mock.calls.length;

    await act(async () => {
      streamListener?.({
        previousStatus: TicketStatusEnum.OPEN,
        ticket: ticket({
          status: TicketStatusEnum.IN_PROGRESS,
          updatedAt: "2026-01-03T00:00:00.000Z",
        }),
      });
    });

    expect(screen.getByTestId("ticket-count-value-all")).toHaveTextContent("2");
    expect(
      screen.getByTestId("ticket-count-value-in_progress"),
    ).toHaveTextContent("2");
    expect(screen.getByTestId("ticket-card")).toHaveTextContent("in_progress");
    expect(listTicketsMock).toHaveBeenCalledTimes(callsBefore);
    expect(countTicketsMock).toHaveBeenCalledTimes(1);
  });

  it("reloads the list when a new ticket arrives and does not recount", async () => {
    view = await renderWithProvidersAsync(<Home />);
    expect(await screen.findByText("Printer")).toBeInTheDocument();

    const callsBefore = listTicketsMock.mock.calls.length;
    listTicketsMock.mockResolvedValue({
      items: [ticket({ id: "t2", title: "New ticket" }), ticket()],
      totalPages: 1,
      total: 2,
    });

    await act(async () => {
      streamListener?.({
        previousStatus: null,
        ticket: ticket({
          id: "t2",
          title: "New ticket",
          updatedAt: "2026-01-03T00:00:00.000Z",
        }),
      });
    });

    expect(await screen.findByText("New ticket")).toBeInTheDocument();
    expect(screen.getByTestId("ticket-count-value-all")).toHaveTextContent("3");
    expect(listTicketsMock).toHaveBeenCalledTimes(callsBefore + 1);
    expect(countTicketsMock).toHaveBeenCalledTimes(1);
  });

  it("opens the support home on the shared open queue", async () => {
    setMockLoggedUser({
      ...mockLoggedUser,
      id: "s1",
      type: UserTypeEnum.SUPPORT,
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
  });
});
