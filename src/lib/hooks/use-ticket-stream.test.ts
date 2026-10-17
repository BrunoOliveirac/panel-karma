import { act, renderHook } from "@testing-library/react";
import { TicketStatusEnum } from "@/lib/enums/ticket-status.enum";
import {
  clearMockLoggedUser,
  setMockLoggedUser,
} from "@/lib/mocks/logged-user.mock";
import { useTicketStream } from "./use-ticket-stream";

class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onopen: (() => void) | null = null;
  listeners = new Map<string, Array<(event: MessageEvent<string>) => void>>();
  close = jest.fn();

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(
    type: string,
    handler: (event: MessageEvent<string>) => void,
  ) {
    const handlers = this.listeners.get(type) ?? [];
    handlers.push(handler);
    this.listeners.set(type, handlers);
  }

  emit(type: string, data: string) {
    const event = { data } as MessageEvent<string>;
    if (type === "message") this.onmessage?.(event);
    this.listeners.get(type)?.forEach((handler) => handler(event));
  }

  open() {
    this.onopen?.();
  }
}

const streamedTicket = {
  id: "t1",
  title: "Help",
  description: "Details",
  status: TicketStatusEnum.OPEN,
  userId: "u1",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

describe("useTicketStream", () => {
  const originalEventSource = global.EventSource;

  beforeEach(() => {
    clearMockLoggedUser();
    MockEventSource.instances = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.EventSource = MockEventSource as any;
    setMockLoggedUser();
  });

  afterEach(() => {
    clearMockLoggedUser();
    global.EventSource = originalEventSource;
  });

  it("opens a single stream for a logged user", () => {
    renderHook(() => useTicketStream());
    renderHook(() => useTicketStream());

    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0]?.url).toBe("/api/tickets/stream");
  });

  it("does not open a stream without a logged user", () => {
    clearMockLoggedUser();

    renderHook(() => useTicketStream());

    expect(MockEventSource.instances).toHaveLength(0);
  });

  it("delivers a parsed ticket from the ticket event", () => {
    const { result } = renderHook(() => useTicketStream());
    const listener = jest.fn();

    act(() => {
      result.current.subscribeToTicket(listener);
    });

    act(() => {
      MockEventSource.instances[0].emit(
        "ticket",
        JSON.stringify(streamedTicket),
      );
    });

    expect(listener).toHaveBeenCalledWith({
      ticket: expect.objectContaining({
        id: "t1",
        status: TicketStatusEnum.OPEN,
      }),
      previousStatus: null,
    });
  });

  it("reads a ticket nested under ticket or data", () => {
    const { result } = renderHook(() => useTicketStream());
    const listener = jest.fn();

    act(() => {
      result.current.subscribeToTicket(listener);
    });

    act(() => {
      MockEventSource.instances[0].emit(
        "ticket",
        JSON.stringify({ data: streamedTicket }),
      );
    });

    expect(listener).toHaveBeenCalledWith({
      ticket: expect.objectContaining({ id: "t1" }),
      previousStatus: null,
    });

    act(() => {
      MockEventSource.instances[0].emit(
        "ticket",
        JSON.stringify({ ticket: { ...streamedTicket, id: "t2" } }),
      );
    });

    expect(listener).toHaveBeenLastCalledWith({
      ticket: expect.objectContaining({ id: "t2" }),
      previousStatus: null,
    });
  });

  it("reads previousStatus next to a nested ticket", () => {
    const { result } = renderHook(() => useTicketStream());
    const listener = jest.fn();

    act(() => {
      result.current.subscribeToTicket(listener);
    });

    act(() => {
      MockEventSource.instances[0].emit(
        "ticket",
        JSON.stringify({
          previousStatus: TicketStatusEnum.OPEN,
          ticket: streamedTicket,
        }),
      );
    });

    expect(listener).toHaveBeenCalledWith({
      ticket: expect.objectContaining({ id: "t1" }),
      previousStatus: TicketStatusEnum.OPEN,
    });
  });

  it("ignores invalid streamed payloads", () => {
    const { result } = renderHook(() => useTicketStream());
    const listener = jest.fn();

    act(() => {
      result.current.subscribeToTicket(listener);
    });

    act(() => {
      MockEventSource.instances[0].emit("ticket", "not-json");
      MockEventSource.instances[0].emit("ticket", JSON.stringify({ id: "t1" }));
    });

    expect(listener).not.toHaveBeenCalled();
  });

  it("asks for a list reload only after the connection reopens", () => {
    const { result } = renderHook(() => useTicketStream());
    const listener = jest.fn();

    act(() => {
      result.current.subscribeToResync(listener);
    });

    act(() => {
      MockEventSource.instances[0].open();
    });

    expect(listener).not.toHaveBeenCalled();

    act(() => {
      MockEventSource.instances[0].open();
    });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("closes the stream on logout and opens a new one after the next login", () => {
    const { rerender } = renderHook(() => useTicketStream());
    const source = MockEventSource.instances[0];

    act(() => {
      clearMockLoggedUser();
    });

    expect(source.close).toHaveBeenCalled();

    act(() => {
      setMockLoggedUser();
    });
    rerender();

    expect(MockEventSource.instances).toHaveLength(2);
    expect(MockEventSource.instances[1]?.url).toBe("/api/tickets/stream");
  });
});
