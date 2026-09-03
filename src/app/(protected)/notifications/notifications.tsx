"use client";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { useNotificationStream } from "@/lib/hooks/use-notification-stream";
import {
  Notification,
  NotificationCounts,
  NotificationStatus,
} from "@/lib/models/notification";
import { NotificationService } from "@/lib/services/notification.service";
import { useTitle } from "@/lib/store/use-title-store";
import { cn } from "@/lib/utils/cn";
import { groupByDate } from "@/lib/utils/group-by-date";
import { richIntl } from "@/lib/utils/rich-intl";
import { parseISO } from "date-fns";
import {
  Bell,
  CheckCheck,
  Cog,
  FolderOpenDot,
  Inbox,
  Info,
  MailOpen,
  PackageOpenIcon,
  Search,
  UserCircle,
  type LucideIcon,
} from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

const notificationIconRecord: Record<string, React.ReactNode> = {
  system: <Cog size={16} />,
  project: <FolderOpenDot size={16} />,
  user: <UserCircle size={16} />,
};

const notificationFilters: {
  id: NotificationStatus;
  label: "all_notifications" | "unread_notifications" | "read_notifications";
  icon: LucideIcon;
}[] = [
  { id: "all", label: "all_notifications", icon: Inbox },
  { id: "unread", label: "unread_notifications", icon: Bell },
  { id: "read", label: "read_notifications", icon: MailOpen },
];

const emptyCounts: NotificationCounts = { all: 0, unread: 0, read: 0 };

export default function Notifications() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const t = useTranslations("notifications");
  const [selectedTab, setSelectedTab] = useState<NotificationStatus>("all");
  const setTitle = useTitle((state) => state.setTitle);
  const notificationService = useMemo(() => new NotificationService(), []);

  const { refreshNotifications, subscribeToStreamNotification } =
    useNotificationStream();

  const [items, setItems] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [counts, setCounts] = useState<NotificationCounts>(emptyCounts);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pendingNotifications, setPendingNotifications] = useState<
    Notification[]
  >([]);

  const itemsRef = useRef(items);
  const requestIdRef = useRef(0);

  const debouncedSetQuery = useDebouncedCallback((value: string) => {
    setQuery(value.trim());
  }, 300);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    setTitle(t("notification_center"));
  }, [setTitle, t]);

  const fetchList = useCallback(
    async (nextPage: number, mode: "replace" | "append") => {
      const requestId = ++requestIdRef.current;

      if (mode === "append") setIsLoadingMore(true);
      else setIsLoading(true);

      try {
        const response = await notificationService.getNotifications({
          page: nextPage,
          query,
          status: selectedTab,
        });

        if (requestId !== requestIdRef.current) return;

        setItems((current) => {
          if (mode === "append") {
            const knownIds = new Set(current.map((item) => item.id));
            return [
              ...current,
              ...response.notifications.filter(
                (item) => !knownIds.has(item.id),
              ),
            ];
          }

          return response.notifications;
        });
        setHasMore(response.hasMore);
        setCounts(response.counts);
        setPage(nextPage);
      } catch (error) {
        console.error(error);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [notificationService, query, selectedTab],
  );

  useEffect(() => {
    fetchList(1, "replace");
  }, [fetchList]);

  useEffect(() => {
    return subscribeToStreamNotification(({ notification, latestPromise }) => {
      if (notification) {
        setPendingNotifications((current) =>
          current.some((item) => item.id === notification.id)
            ? current
            : [...current, notification],
        );
        return;
      }

      latestPromise.then((latest) => {
        const knownIds = new Set(itemsRef.current.map((item) => item.id));
        const incoming = latest.notifications.filter(
          (item) => !knownIds.has(item.id),
        );

        if (!incoming.length) return;

        setPendingNotifications((current) => {
          const currentIds = new Set(current.map((item) => item.id));
          return [
            ...current,
            ...incoming.filter((item) => !currentIds.has(item.id)),
          ];
        });
      });
    });
  }, [subscribeToStreamNotification]);

  const showRefreshBanner = useMemo(
    () =>
      pendingNotifications.some((notification) =>
        notificationMatchesRefreshBanner(notification, selectedTab, search),
      ),
    [pendingNotifications, search, selectedTab],
  );

  /**
   * Fetch the first page with the current filters and drop the pending SSE banner.
   */
  const reloadList = () => {
    setPendingNotifications([]);
    refreshNotifications();
    fetchList(1, "replace");
  };

  /**
   * Mark a notification as read locally and keep tab counts in sync.
   */
  const applyLocalRead = (notificationId: string) => {
    const target = items.find((item) => item.id === notificationId);
    if (!target || target.read) return;

    setItems((current) => {
      if (selectedTab === "unread") {
        return current.filter((item) => item.id !== notificationId);
      }

      return current.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item,
      );
    });
    setCounts((current) => ({
      ...current,
      unread: Math.max(0, current.unread - 1),
      read: current.read + 1,
    }));
  };

  /**
   * Mark every loaded notification as read and reset unread counts.
   */
  const applyLocalReadAll = () => {
    setItems((current) =>
      selectedTab === "unread"
        ? []
        : current.map((item) => ({ ...item, read: true })),
    );
    setCounts((current) => ({
      all: current.all,
      unread: 0,
      read: current.all,
    }));
  };

  /**
   * Remove a notification from the list and adjust tab counts.
   */
  const applyLocalDelete = (notificationId: string) => {
    const target = items.find((item) => item.id === notificationId);
    if (!target) return;

    setItems((current) => current.filter((item) => item.id !== notificationId));
    setCounts((current) => ({
      all: Math.max(0, current.all - 1),
      unread: target.read ? current.unread : Math.max(0, current.unread - 1),
      read: target.read ? Math.max(0, current.read - 1) : current.read,
    }));
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden gap-4 pb-6">
      <div className="flex items-center gap-4">
        <p className="shrink-0 text-lg font-medium">
          {t("notification_center")}
        </p>

        {showRefreshBanner && (
          <div className="relative flex justify-center items-center text-sm leading-5 gap-2 p-2 rounded-md bg-(--warn)/10">
            <Info size={16} color="var(--warn)" />

            <p
              data-slot="new-notification-received"
              className="text-muted-foreground text-center"
            >
              {t("new_notifications_received")}
            </p>

            <button
              type="button"
              onClick={reloadList}
              data-slot="refresh-notifications"
              className="font-medium text-primary hover:underline"
            >
              {t("refresh")}
            </button>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden md:flex-row md:gap-6">
        <aside
          data-slot="notification-filters"
          className="w-full shrink-0 md:w-72 lg:w-80"
        >
          <div className="overflow-hidden rounded-xl border border-primary/30 shadow-sm ">
            <div className="border-b border-primary/15 p-1">
              <InputGroup className="bg-transparent border-0">
                <InputGroupInput
                  value={search}
                  placeholder={t("search")}
                  dataSlot="notifications-search"
                  onChange={(e) => {
                    setSearch(e.target.value);
                    debouncedSetQuery(e.target.value);
                  }}
                />

                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
              </InputGroup>
            </div>

            <NotificationSidebar
              counts={counts}
              selectedTab={selectedTab}
              onSelectTab={setSelectedTab}
              onReadAll={applyLocalReadAll}
            />
          </div>
        </aside>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          {isLoading && !isLoadingMore ? (
            <div className="flex justify-center">
              <Spinner />
            </div>
          ) : (
            <NotificationContent
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              notifications={items}
              onDelete={applyLocalDelete}
              onLoadMore={() => fetchList(page + 1, "append")}
              onMarkAsRead={applyLocalRead}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationSidebar({
  counts,
  selectedTab,
  onSelectTab,
  onReadAll,
}: {
  counts: NotificationCounts;
  selectedTab: NotificationStatus;
  onSelectTab: (tabId: NotificationStatus) => void;
  onReadAll: () => void;
}) {
  const t = useTranslations("notifications");
  const sharedT = useTranslations("shared");
  const notificationService = useMemo(() => new NotificationService(), []);
  const { markAllNotificationsReadLocally } = useNotificationStream();
  const hasUnreadNotifications = counts.unread > 0;

  /**
   * Mark all notifications as read.
   */
  const markAllNotificationsAsRead = async () => {
    try {
      await notificationService.markAllNotificationsAsRead();
      markAllNotificationsReadLocally();
      onReadAll();
      toast.success(t("notification_marked_all_as_read"));
    } catch (error) {
      console.error(error);
      toast.error(t("notification_mark_all_as_read_failed"));
    }
  };

  return (
    <>
      <div className="p-3">
        <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {t("filters")}
        </p>

        <NotificationFilterList
          counts={counts}
          selectedTab={selectedTab}
          onSelectTab={onSelectTab}
        />
      </div>

      <div className="border-t border-primary/15 p-4">
        <p className="pb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {sharedT("actions")}
        </p>

        <button
          type="button"
          data-slot="mark-all-as-read"
          disabled={!hasUnreadNotifications}
          onClick={markAllNotificationsAsRead}
          className={cn(
            "flex h-9 w-full items-center justify-center gap-2 rounded-full px-3 text-sm transition",
            hasUnreadNotifications
              ? "bg-linear-to-br from-primary to-(--info) text-white hover:brightness-75"
              : "cursor-not-allowed bg-black/5 text-muted-foreground dark:bg-white/10",
          )}
        >
          <CheckCheck size={16} />
          {t("mark_all_as_read")}
        </button>
      </div>
    </>
  );
}

function NotificationFilterList({
  counts,
  selectedTab,
  onSelectTab,
}: {
  counts: NotificationCounts;
  selectedTab: string;
  onSelectTab: (tabId: NotificationStatus) => void;
}) {
  const t = useTranslations("notifications");

  return (
    <div className="grid grid-cols-1 gap-1">
      {notificationFilters.map((filter) => {
        const selected = selectedTab === filter.id;
        const Icon = filter.icon;

        return (
          <button
            key={filter.id}
            type="button"
            data-slot={`tab-${filter.id}`}
            aria-pressed={selected}
            onClick={() => onSelectTab(filter.id)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition",
              selected
                ? "bg-primary/15 font-medium text-primary"
                : "text-foreground/80 hover:bg-black/5 dark:hover:bg-white/5",
            )}
          >
            <Icon size={16} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">{t(filter.label)}</span>

            <span
              className={cn(
                "shrink-0 rounded-full px-1.5 py-0.5 text-[11px] tabular-nums",
                selected
                  ? "bg-primary/20 text-primary"
                  : "bg-black/5 text-muted-foreground dark:bg-white/10",
              )}
            >
              {counts[filter.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function NotificationContent({
  hasMore,
  isLoadingMore,
  notifications,
  onDelete,
  onLoadMore,
  onMarkAsRead,
}: {
  hasMore: boolean;
  isLoadingMore: boolean;
  notifications: Notification[];
  onDelete: (notificationId: string) => void;
  onLoadMore: () => void;
  onMarkAsRead: (notificationId: string) => void;
}) {
  const t = useTranslations("notifications");
  const format = useFormatter();
  const notificationService = useMemo(() => new NotificationService(), []);
  const { markNotificationReadLocally, refreshNotifications } =
    useNotificationStream();

  const groupedNotifications = useMemo(
    () => groupByDate(notifications),
    [notifications],
  );

  /**
   * Mark a notification as read.
   * @param notificationId - The ID of the notification to mark as read.
   */
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
      markNotificationReadLocally(notificationId);
      onMarkAsRead(notificationId);
      toast.success(t("notification_marked_as_read"));
    } catch (error) {
      console.error(error);
      toast.error(t("notification_mark_as_read_failed"));
    }
  };

  /**
   * Delete a notification.
   * @param notificationId - The ID of the notification to delete.
   */
  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      onDelete(notificationId);
      refreshNotifications();
      toast.success(t("notification_deleted"));
    } catch (error) {
      console.error(error);
      toast.error(t("notification_delete_failed"));
    }
  };

  if (!notifications.length) {
    return (
      <div className="flex h-full flex-col items-center gap-2 text-gray-400">
        <PackageOpenIcon size={40} strokeWidth="1.5" />
        <p>{t("notifications_not_found")}</p>
      </div>
    );
  }

  return (
    <div data-slot="notification-timeline">
      {groupedNotifications.map((group, groupIndex) => {
        const isLastGroup = groupIndex === groupedNotifications.length - 1;

        return (
          <section
            key={group.date}
            className="flex gap-4 px-1"
            data-slot={`notification-group-${group.date}`}
          >
            <div className="flex flex-col items-center">
              <span className="mt-1.5 size-3 shrink-0 rounded-full bg-primary ring-4 ring-primary/20" />

              <div
                className={cn(
                  "w-px flex-1 bg-primary/20",
                  isLastGroup &&
                    "bg-linear-to-b from-primary/20 to-transparent",
                )}
              />
            </div>

            <div className={cn("min-w-0 flex-1", !isLastGroup && "pb-8")}>
              <p className="text-sm font-semibold leading-6">
                {format.dateTime(parseISO(group.date), {
                  dateStyle: "long",
                })}
              </p>

              <div className="mt-4 grid gap-3">
                {group.datas.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onDelete={deleteNotification}
                    onMarkAsRead={markNotificationAsRead}
                  />
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={isLoadingMore}
            data-slot="load-more-notifications"
            onClick={onLoadMore}
          >
            {isLoadingMore ? <Spinner /> : t("load_more")}
          </Button>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  onDelete,
  onMarkAsRead,
}: {
  notification: Notification;
  onDelete: (notificationId: string) => void;
  onMarkAsRead: (notificationId: string) => void;
}) {
  const now = useNow();
  const format = useFormatter();
  const t = useTranslations("notifications");

  return (
    <div
      data-slot={`notification-${notification.id}`}
      className={cn(
        "rounded-2xl p-4 ring-1 ring-foreground/10",
        !notification.read && "ring-primary/30",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "rounded-md p-1.5",
            notification.read
              ? "bg-black/20 text-black dark:bg-white/20 dark:text-white"
              : "bg-primary/40 text-primary",
          )}
        >
          <div className="relative">
            {notificationIconRecord[notification.type]}

            {!notification.read && (
              <span className="absolute -top-2 -left-2 size-3 rounded-full bg-primary" />
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm">
            {t.rich(notification.code, {
              ...getNotificationIntlParams(notification),
              ...richIntl,
            })}
          </p>

          <p className="my-1 text-xs text-muted-foreground">
            {format.relativeTime(
              Math.min(
                new Date(notification.createdAt).getTime(),
                now.getTime(),
              ),
              now,
            )}
          </p>

          <div className="flex flex-wrap gap-2">
            {!notification.read && (
              <Button
                size="xs"
                className="rounded-sm"
                data-slot={`mark-as-read-${notification.id}`}
                onClick={() => onMarkAsRead(notification.id)}
              >
                {t("mark_as_read")}
              </Button>
            )}

            <Button
              size="xs"
              variant="destructive"
              className="rounded-sm"
              data-slot={`delete-notification-${notification.id}`}
              onClick={() => onDelete(notification.id)}
            >
              {t("delete")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function notificationMatchesRefreshBanner(
  notification: Notification,
  selectedTab: NotificationStatus,
  search: string,
) {
  if (selectedTab === "read") return false;
  if (selectedTab === "unread" && notification.read) return false;

  const term = search.trim().toLowerCase();
  if (!term) return true;

  return [notification.actor?.name, notification.referenceLabel].some((value) =>
    value?.toLowerCase().includes(term),
  );
}

function getNotificationIntlParams(
  notification: Notification,
): Record<string, string> {
  switch (notification.code) {
    case "linked_by_user":
    case "unlinked_by_user":
      return { name: notification.referenceLabel ?? "" };

    case "linked_to_project":
      return {
        project: notification.referenceLabel ?? "",
        name: notification.actor?.name ?? "",
      };

    default:
      return {};
  }
}
