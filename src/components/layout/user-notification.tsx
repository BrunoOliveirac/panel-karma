"use client";

import {
  LatestNotificationsResponse,
  Notification,
} from "@/lib/models/notification";
import {
  useNotificationStream,
  withLocalReadState,
} from "@/lib/hooks/use-notification-stream";
import { NotificationService } from "@/lib/services/notification.service";
import { cn } from "@/lib/utils/cn";
import { richIntl } from "@/lib/utils/rich-intl";
import { Bell, Cog, FolderOpenDot, UserCircle } from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { Suspense, use, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Spinner } from "../ui/spinner";

interface UserNotificationProps {
  notificationsPromise: Promise<LatestNotificationsResponse>;
  refreshNotifications: () => void;
  markNotificationReadLocally: (notificationId: string) => void;
  markAllNotificationsReadLocally: () => void;
}

const notificationIconRecord: Record<string, React.ReactNode> = {
  system: <Cog size={16} />,
  project: <FolderOpenDot size={16} />,
  user: <UserCircle size={16} />,
};

export default function UserNotification() {
  const {
    notificationsPromise,
    refreshNotifications,
    markNotificationReadLocally,
    markAllNotificationsReadLocally,
  } = useNotificationStream();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="relative">
          <Bell className="text-primary" size={20} />

          {notificationsPromise && (
            <Suspense fallback={null}>
              <UnreadBadge notificationsPromise={notificationsPromise} />
            </Suspense>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-3! rounded-xl" align="end">
        {notificationsPromise && (
          <Suspense
            fallback={
              <div className="flex justify-center">
                <Spinner />
              </div>
            }
          >
            <NotificationItems
              notificationsPromise={notificationsPromise}
              refreshNotifications={refreshNotifications}
              markNotificationReadLocally={markNotificationReadLocally}
              markAllNotificationsReadLocally={markAllNotificationsReadLocally}
            />
          </Suspense>
        )}
      </PopoverContent>
    </Popover>
  );
}

function UnreadBadge({
  notificationsPromise,
}: Pick<UserNotificationProps, "notificationsPromise">) {
  const { hasUnreadNotifications } = withLocalReadState(
    use(notificationsPromise),
  );

  if (!hasUnreadNotifications) return null;

  return (
    <span className="absolute -top-0.5 -right-0.5 bg-primary text-white rounded-full w-3 h-3 flex items-center justify-center text-xs" />
  );
}

function NotificationItems({
  notificationsPromise,
  refreshNotifications,
  markNotificationReadLocally,
  markAllNotificationsReadLocally,
}: UserNotificationProps) {
  const now = useNow();
  const format = useFormatter();
  const t = useTranslations("notifications");
  const notificationService = useMemo(() => new NotificationService(), []);

  const { hasUnreadNotifications, notifications } = withLocalReadState(
    use(notificationsPromise),
  );

  /**
   * Set the content of the notification.
   * @param notification - The notification to set the content for.
   * @returns The content of the notification.
   */
  const setContentNotification = (notification: Notification) => {
    let intlParams: Record<string, string> = {};

    switch (notification.code) {
      case "linked_by_user":
        intlParams = { name: notification.referenceLabel ?? "" };
        break;

      case "unlinked_by_user":
        intlParams = { name: notification.referenceLabel ?? "" };
        break;

      case "linked_to_project":
        intlParams = {
          project: notification.referenceLabel ?? "",
          name: notification.user.name ?? "",
        };

        break;
    }

    return t.rich(notification.code, { ...intlParams, ...richIntl });
  };

  /**
   * Mark a notification as read.
   * @param notificationId - The ID of the notification to mark as read.
   * @returns void
   */
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
      markNotificationReadLocally(notificationId);
      toast.success(t("notification_marked_as_read"));
    } catch (error) {
      console.error(error);
      toast.error(t("notification_mark_as_read_failed"));
    }
  };

  /**
   * Mark all notifications as read.
   * @returns void
   */
  const markAllNotificationsAsRead = async () => {
    try {
      await notificationService.markAllNotificationsAsRead();
      markAllNotificationsReadLocally();
      toast.success(t("notification_marked_all_as_read"));
    } catch (error) {
      console.error(error);
      toast.error(t("notification_mark_all_as_read_failed"));
    }
  };

  /**
   * Delete a notification.
   * @param notificationId - The ID of the notification to delete.
   * @returns void
   */
  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      refreshNotifications();
      toast.success(t("notification_deleted"));
    } catch (error) {
      console.error(error);
      toast.error(t("notification_delete_failed"));
    }
  };

  return notifications.length > 0 ? (
    <>
      <div className="flex justify-between items-center gap-2">
        <p>{t("notifications")}</p>

        <Button
          size="sm"
          className="rounded-sm"
          disabled={!hasUnreadNotifications}
          onClick={markAllNotificationsAsRead}
          variant={hasUnreadNotifications ? "default" : "outline"}
        >
          {t("mark_all_as_read")}
        </Button>
      </div>

      <div className="grid gap-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="group flex items-start gap-2 hover:bg-secondary p-2 rounded-md transition"
          >
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
                  <span className="absolute -top-2 -left-2 bg-primary text-white rounded-full w-3 h-3 flex items-center justify-center text-xs"></span>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm line-clamp-2">
                {setContentNotification(notification)}
              </p>

              <p className="text-xs text-muted-foreground my-1">
                {format.relativeTime(
                  Math.min(new Date(notification.createdAt).getTime(), now.getTime()),
                  now,
                )}
              </p>

              <div className="flex gap-2">
                {!notification.read && (
                  <Button
                    size="xs"
                    className="rounded-sm"
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    {t("mark_as_read")}
                  </Button>
                )}

                <Button
                  size="xs"
                  variant="destructive"
                  className="rounded-sm"
                  onClick={() => deleteNotification(notification.id)}
                >
                  {t("delete")}
                </Button>
              </div>
            </div>
          </div>
        ))}

        <Button size="sm" className="rounded-sm max-w-28 mx-auto w-full mt-2">
          {t("view_all")}
        </Button>
      </div>
    </>
  ) : (
    <>
      <p>{t("notifications")}</p>

      <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
        {t("notifications_not_found")}
      </p>
    </>
  );
}
