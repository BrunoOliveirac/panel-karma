import { act, renderHook, waitFor } from "@testing-library/react";
import { setMockLoggedUser } from "@/lib/mocks/logged-user.mock";
import { LatestNotificationsResponse, Notification } from "@/lib/models/notification";
import {
  useNotificationStream,
  withLocalReadState,
} from "./use-notification-stream";

const getLatestNotificationsMock = jest.fn();

jest.mock("@/lib/services/notification.service", () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    getLatestNotifications: (...args: unknown[]) =>
      getLatestNotificationsMock(...args),
  })),
}));

class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
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
}

const notification = {
  id: "n1",
  code: "linked_by_user",
  type: "user",
  read: false,
} as Notification;

const latest: LatestNotificationsResponse = {
  notifications: [notification],
  hasUnreadNotifications: true,
};

describe("useNotificationStream", () => {
  const originalEventSource = global.EventSource;

  beforeEach(() => {
    MockEventSource.instances = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.EventSource = MockEventSource as any;
    getLatestNotificationsMock.mockResolvedValue(latest);
    setMockLoggedUser();
  });

  afterEach(() => {
    global.EventSource = originalEventSource;
  });

  it("starts a stream and fetches the latest notifications for a logged user", async () => {
    const { result } = renderHook(() => useNotificationStream());

    expect(MockEventSource.instances[0]?.url).toBe("/api/notifications/stream");
    expect(result.current.notificationsPromise).not.toBeNull();
    await expect(result.current.notificationsPromise).resolves.toEqual(latest);
  });

  it("applies local read marks without replacing the list promise", async () => {
    const { result } = renderHook(() => useNotificationStream());
    await result.current.notificationsPromise;

    act(() => {
      result.current.markNotificationReadLocally("n1");
    });

    expect(withLocalReadState(latest)).toEqual({
      notifications: [{ ...notification, read: true }],
      hasUnreadNotifications: false,
    });
  });

  it("marks every notification as read locally", async () => {
    const { result } = renderHook(() => useNotificationStream());
    await result.current.notificationsPromise;

    act(() => {
      result.current.markAllNotificationsReadLocally();
    });

    expect(withLocalReadState(latest).hasUnreadNotifications).toBe(false);
  });

  it("notifies stream subscribers with a parsed notification", async () => {
    const { result } = renderHook(() => useNotificationStream());
    const listener = jest.fn();

    act(() => {
      result.current.subscribeToStreamNotification(listener);
    });

    getLatestNotificationsMock.mockResolvedValueOnce({
      notifications: [],
      hasUnreadNotifications: false,
    });

    act(() => {
      MockEventSource.instances[0].emit(
        "notification",
        JSON.stringify({ id: "n2", code: "system" }),
      );
    });

    await waitFor(() => {
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          notification: expect.objectContaining({ id: "n2", code: "system" }),
        }),
      );
    });
  });

  it("ignores invalid streamed payloads", async () => {
    const { result } = renderHook(() => useNotificationStream());
    const listener = jest.fn();

    act(() => {
      result.current.subscribeToStreamNotification(listener);
    });

    act(() => {
      MockEventSource.instances[0].emit("notification", "not-json");
    });

    await waitFor(() => {
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ notification: null }),
      );
    });
  });
});
