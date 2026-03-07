"use client";

import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useTranslations } from "next-intl";

export default function UserNotification() {
  const t = useTranslations("topbar");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button>
          <Bell className="text-primary" size={20} />
        </button>
      </PopoverTrigger>

      <PopoverContent>
        <p>{t("notifications_not_found")}</p>
      </PopoverContent>
    </Popover>
  );
}
