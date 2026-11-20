/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import { useNotificationStream } from "@/lib/hooks/use-notification-stream";
import { renderWithProvidersAsync } from "@/lib/mocks/render-with-providers.mock";
import {
  Notification,
  NotificationListParams,
  NotificationListResponse,
} from "@/lib/models/notification";
import { StreamNotificationPayload } from "@/lib/hooks/use-notification-stream";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { _Translator, useFormatter } from "next-intl";
import { toast } from "sonner";
import Notifications from "./notifications";

const getNotificationsMock = jest.fn();
const markNotificationAsReadMock = jest.fn();
const markAllNotificationsAsReadMock = jest.fn();
const deleteNotificationMock = jest.fn();
const refreshNotificationsMock = jest.fn();
const markNotificationReadLocallyMock = jest.fn();
const markAllNotificationsReadLocallyMock = jest.fn();

let streamListener: ((payload: StreamNotificationPayload) => void) | null =
  null;

jest.mock("use-intl", () => ({
  useTranslations: () => (t: _Translator<Record<string, any>>) => t,
}));

jest.mock("next-intl", () => {
  const translate = Object.assign((key: string) => key, {
    rich: (key: string) => key,
  });

  return {
    useTranslations: () => translate,
    useFormatter: jest.fn(),
    useNow: () => new Date("2026-08-28T15:00:00.000Z"),
  };
});

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/hooks/use-notification-stream", () => {
  const actual = jest.requireActual("@/lib/hooks/use-notification-stream");

  return {
    ...actual,
    useNotificationStream: jest.fn(),
  };
});

jest.mock("@/lib/services/notification.service", () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    getNotifications: (...args: unknown[]) => getNotificationsMock(...args),
    markNotificationAsRead: (...args: string[]) =>
      markNotificationAsReadMock(...args),
    markAllNotificationsAsRead: () => markAllNotificationsAsReadMock(),
    deleteNotification: (...args: string[]) => deleteNotificationMock(...args),
  })),
}));

jest.mocked(useFormatter).mockReturnValue({
  dateTime: (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
  relativeTime: () => "2 hours ago",
} as any);

const mockUser = {
  id: "u1",
  name: "Alice",
  email: "alice@email.com",
  type: UserTypeEnum.USER,
  active: true,
  createdAt: "2026-08-01T10:00:00.000Z",
};

function mockNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "01",
    active: true,
    createdAt: "2026-08-28T10:00:00.000Z",
    user: mockUser,
    code: "linked_by_user",
    type: "user",
    read: false,
    referenceLabel: "Alice",
    ...overrides,
  };
}

function mockStream() {
  streamListener = null;

  jest.mocked(useNotificationStream).mockReturnValue({
    notificationsPromise: Promise.resolve({
      notifications: [],
      hasUnreadNotifications: false,
    }),
    refreshNotifications: refreshNotificationsMock,
    markNotificationReadLocally: markNotificationReadLocallyMock,
    markAllNotificationsReadLocally: markAllNotificationsReadLocallyMock,
    subscribeToStreamNotification: (listener) => {
      streamListener = listener;
      return () => {
        if (streamListener === listener) streamListener = null;
      };
    },
  });
}

function countsFor(list: Notification[]) {
  return {
    all: list.length,
    unread: list.filter((notification) => !notification.read).length,
    read: list.filter((notification) => notification.read).length,
  };
}

function filterList(
  source: Notification[],
  params: NotificationListParams,
): NotificationListResponse {
  const term = params.query.trim().toLowerCase();

  const notifications = source.filter((notification) => {
    if (params.status === "unread" && notification.read) return false;
    if (params.status === "read" && !notification.read) return false;
    if (!term) return true;

    return [notification.actor?.name, notification.referenceLabel].some(
      (value) => value?.toLowerCase().includes(term),
    );
  });

  return {
    notifications,
    hasMore: false,
    counts: countsFor(source.filter((notification) => {
      if (!term) return true;

      return [notification.actor?.name, notification.referenceLabel].some(
        (value) => value?.toLowerCase().includes(term),
      );
    })),
  };
}

async function renderNotifications() {
  await renderWithProvidersAsync(<Notifications />);

  await waitFor(() => {
    expect(getNotificationsMock).toHaveBeenCalled();
  });
}

describe("Notifications", () => {
  const notifications = [
    mockNotification({ id: "01", createdAt: "2026-08-28T18:00:00.000Z" }),
    mockNotification({
      id: "02",
      createdAt: "2026-08-28T08:00:00.000Z",
      read: true,
      code: "unlinked_by_user",
      referenceLabel: "Bob",
    }),
    mockNotification({
      id: "03",
      createdAt: "2026-08-27T10:00:00.000Z",
      code: "linked_to_project",
      referenceLabel: "Karma",
      type: "project",
    }),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockStream();
    getNotificationsMock.mockImplementation((params: NotificationListParams) =>
      Promise.resolve(filterList(notifications, params)),
    );
  });

  it("Should show an empty list", async () => {
    getNotificationsMock.mockResolvedValue({
      notifications: [],
      hasMore: false,
      counts: { all: 0, unread: 0, read: 0 },
    });

    await renderNotifications();

    expect(await screen.findByText("notifications_not_found")).toBeInTheDocument();
    expect(getNotificationsMock).toHaveBeenCalledWith({
      page: 1,
      query: "",
      status: "all",
    });
  });

  it("Should group notifications in a timeline", async () => {
    await renderNotifications();

    expect(await screen.findByTestId("notification-timeline")).toBeInTheDocument();
    expect(
      screen.getByTestId("notification-group-2026-08-28"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("notification-group-2026-08-27"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("notification-01")).toBeInTheDocument();
    expect(screen.getByTestId("notification-02")).toBeInTheDocument();
    expect(screen.getByTestId("notification-03")).toBeInTheDocument();
  });

  it("Should filter unread notifications", async () => {
    await renderNotifications();
    await screen.findByTestId("notification-01");

    fireEvent.click(screen.getByTestId("tab-unread"));

    await waitFor(() => {
      expect(getNotificationsMock).toHaveBeenCalledWith({
        page: 1,
        query: "",
        status: "unread",
      });
    });

    expect(await screen.findByTestId("notification-01")).toBeInTheDocument();
    expect(screen.getByTestId("notification-03")).toBeInTheDocument();
    expect(screen.queryByTestId("notification-02")).not.toBeInTheDocument();
  });

  it("Should filter read notifications", async () => {
    await renderNotifications();
    await screen.findByTestId("notification-01");

    fireEvent.click(screen.getByTestId("tab-read"));

    await waitFor(() => {
      expect(getNotificationsMock).toHaveBeenCalledWith({
        page: 1,
        query: "",
        status: "read",
      });
    });

    expect(await screen.findByTestId("notification-02")).toBeInTheDocument();
    expect(screen.queryByTestId("notification-01")).not.toBeInTheDocument();
    expect(screen.queryByTestId("notification-03")).not.toBeInTheDocument();
  });

  it("Should filter notifications by search", async () => {
    await renderNotifications();
    await screen.findByTestId("notification-01");

    fireEvent.change(screen.getByTestId("notifications-search"), {
      target: { value: "Bob" },
    });

    await waitFor(() => {
      expect(getNotificationsMock).toHaveBeenCalledWith({
        page: 1,
        query: "Bob",
        status: "all",
      });
    });

    expect(await screen.findByTestId("notification-02")).toBeInTheDocument();
    expect(screen.queryByTestId("notification-01")).not.toBeInTheDocument();
    expect(screen.queryByTestId("notification-03")).not.toBeInTheDocument();
  });

  it("Should concatenate the next page when load more is clicked", async () => {
    const pageOne = mockNotification({
      id: "01",
      createdAt: "2026-08-28T18:00:00.000Z",
    });
    const pageTwo = mockNotification({
      id: "04",
      createdAt: "2026-08-26T10:00:00.000Z",
      referenceLabel: "Carol",
    });

    getNotificationsMock.mockImplementation(({ page }: NotificationListParams) =>
      Promise.resolve({
        notifications: page === 1 ? [pageOne] : [pageTwo],
        hasMore: page === 1,
        counts: { all: 2, unread: 2, read: 0 },
      }),
    );

    await renderNotifications();

    expect(await screen.findByTestId("notification-01")).toBeInTheDocument();
    expect(screen.queryByTestId("notification-04")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("load-more-notifications"));

    await waitFor(() => {
      expect(getNotificationsMock).toHaveBeenCalledWith({
        page: 2,
        query: "",
        status: "all",
      });
    });

    expect(await screen.findByTestId("notification-04")).toBeInTheDocument();
    expect(screen.getByTestId("notification-01")).toBeInTheDocument();
    expect(
      screen.queryByTestId("load-more-notifications"),
    ).not.toBeInTheDocument();
  });

  it("Should mark a notification as read", async () => {
    markNotificationAsReadMock.mockResolvedValue(undefined);
    await renderNotifications();
    await screen.findByTestId("mark-as-read-01");

    fireEvent.click(screen.getByTestId("mark-as-read-01"));

    await waitFor(() => {
      expect(markNotificationAsReadMock).toHaveBeenCalledWith("01");
      expect(markNotificationReadLocallyMock).toHaveBeenCalledWith("01");
      expect(toast.success).toHaveBeenCalledWith("notification_marked_as_read");
    });
  });

  it("Should show the refresh banner when a streamed notification matches the current view", async () => {
    await renderNotifications();
    await screen.findByTestId("notification-01");

    const incoming = mockNotification({
      id: "99",
      referenceLabel: "User 02",
    });

    await act(async () => {
      streamListener?.({
        notification: incoming,
        latestPromise: Promise.resolve({
          notifications: [...notifications, incoming],
          hasUnreadNotifications: true,
        }),
      });
    });

    expect(screen.getByTestId("new-notification-received")).toBeInTheDocument();
    expect(screen.queryByTestId("notification-99")).not.toBeInTheDocument();
  });

  it("Should hide the refresh banner on the read category", async () => {
    await renderNotifications();
    await screen.findByTestId("notification-01");

    fireEvent.click(screen.getByTestId("tab-read"));
    await screen.findByTestId("notification-02");

    await act(async () => {
      streamListener?.({
        notification: mockNotification({ id: "99", referenceLabel: "User 02" }),
        latestPromise: Promise.resolve({
          notifications,
          hasUnreadNotifications: true,
        }),
      });
    });

    expect(
      screen.queryByTestId("new-notification-received"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("tab-all"));
    await screen.findByTestId("notification-01");

    expect(screen.getByTestId("new-notification-received")).toBeInTheDocument();
  });

  it("Should show the refresh banner on the unread category", async () => {
    await renderNotifications();
    await screen.findByTestId("notification-01");

    fireEvent.click(screen.getByTestId("tab-unread"));
    await waitFor(() => {
      expect(getNotificationsMock).toHaveBeenCalledWith({
        page: 1,
        query: "",
        status: "unread",
      });
    });
    await screen.findByTestId("notification-01");

    await act(async () => {
      streamListener?.({
        notification: mockNotification({ id: "99", referenceLabel: "User 02" }),
        latestPromise: Promise.resolve({
          notifications,
          hasUnreadNotifications: true,
        }),
      });
    });

    expect(screen.getByTestId("new-notification-received")).toBeInTheDocument();
  });

  it("Should hide the refresh banner when the search does not match the streamed notification", async () => {
    await renderNotifications();
    await screen.findByTestId("notification-01");

    fireEvent.change(screen.getByTestId("notifications-search"), {
      target: { value: "01" },
    });

    await act(async () => {
      streamListener?.({
        notification: mockNotification({
          id: "99",
          referenceLabel: "User 02",
          user: { ...mockUser, name: "User 02" },
        }),
        latestPromise: Promise.resolve({
          notifications,
          hasUnreadNotifications: true,
        }),
      });
    });

    expect(
      screen.queryByTestId("new-notification-received"),
    ).not.toBeInTheDocument();
  });

  it("Should apply the latest list when the refresh banner is clicked", async () => {
    const incoming = mockNotification({
      id: "99",
      createdAt: "2026-08-29T10:00:00.000Z",
      referenceLabel: "User 02",
    });

    await renderNotifications();
    await screen.findByTestId("notification-01");

    getNotificationsMock.mockImplementation((params: NotificationListParams) =>
      Promise.resolve(filterList([...notifications, incoming], params)),
    );

    await act(async () => {
      streamListener?.({
        notification: incoming,
        latestPromise: Promise.resolve({
          notifications: [...notifications, incoming],
          hasUnreadNotifications: true,
        }),
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("refresh-notifications"));
    });

    await waitFor(() => {
      expect(refreshNotificationsMock).toHaveBeenCalled();
      expect(screen.getByTestId("notification-99")).toBeInTheDocument();
      expect(
        screen.queryByTestId("new-notification-received"),
      ).not.toBeInTheDocument();
    });
  });
});
