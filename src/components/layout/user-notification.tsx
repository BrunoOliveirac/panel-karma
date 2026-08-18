"use client";

import { Notification } from "@/lib/models/notification";
import { cn } from "@/lib/utils/cn";
import { richIntl } from "@/lib/utils/rich-intl";
import { Bell, Cog, FolderOpenDot, UserCircle } from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { use } from "react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface UserNotificationProps {
  notificationsPromise: Promise<Notification[]>;
}

const notificationIconRecord: Record<string, React.ReactNode> = {
  system: <Cog size={16} />,
  project: <FolderOpenDot size={16} />,
  user: <UserCircle size={16} />,
};

export default function UserNotification({
  notificationsPromise,
}: UserNotificationProps) {
  const notifications = use(notificationsPromise);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative">
          <Bell className="text-primary" size={20} />

          {notifications.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-primary text-white rounded-full w-3 h-3 flex items-center justify-center text-xs"></span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-2! rounded-xl" align="end">
        <NotificationItems notifications={notifications} />
      </PopoverContent>
    </Popover>
  );
}

function NotificationItems({
  notifications,
}: {
  notifications: Notification[];
}) {
  const now = useNow();
  const format = useFormatter();
  const t = useTranslations("notifications");

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

  return notifications.length > 0 ? (
    <div className="grid gap-1">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="group flex items-start gap-2 hover:bg-secondary p-2 rounded-md transition"
        >
          <div
            className={cn(
              "rounded-md p-1.5",
              notification.read
                ? "bg-black/40 text-black dark:bg-white/40 dark:text-white"
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
              {format.relativeTime(notification.createdAt, now)}
            </p>

            <div className="flex gap-2">
              <Button size="xs" className="rounded-sm">
                {t("mark_as_read")}
              </Button>

              <Button size="xs" variant="destructive" className="rounded-sm">
                {t("delete")}
              </Button>
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-between items-center gap-2 mt-2">
        <Button size="sm" variant="ghost" className="rounded-sm">
          {t("mark_all_as_read")}
        </Button>

        <Button size="sm" className="rounded-sm">
          {t("view_all")}
        </Button>
      </div>
    </div>
  ) : (
    <p>{t("notifications_not_found")}</p>
  );
}
