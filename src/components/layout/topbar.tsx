import { UserRouteMap } from "@/lib/enums/user-type.enum";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAppStore } from "@/lib/store/use-title-store";
import { ChevronLeft, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import UserNotification from "./user-notification";
import UserAvatar from "../global/user-avatar";

export default function Topbar() {
  const router = useRouter();
  const { data } = useAuth();
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const title = useAppStore((state) => state.title);
  const displayBackButton = UserRouteMap.get(data?.user.type) !== pathname;

  return (
    <div className="flex justify-between items-center gap-4 px-4 md:px-8 h-14 w-full mb-2">
      <div className="flex items-center gap-3">
        {displayBackButton && (
          <button onClick={router.back}>
            <ChevronLeft className="text-primary" size={20} />
          </button>
        )}

        <p className="text-sm font-medium">{title}</p>
      </div>

      <div className="flex items-center gap-3">
        <UserNotification />

        {resolvedTheme === "dark" ? (
          <button className="cursor-pointer" onClick={() => setTheme("light")}>
            <Moon className="text-primary" size={20} />
          </button>
        ) : (
          <button className="cursor-pointer" onClick={() => setTheme("dark")}>
            <Sun className="text-primary" size={20} />
          </button>
        )}

        {data && (
          <UserAvatar name={data.user.name} avatar={data?.user.avatar} />
        )}
      </div>
    </div>
  );
}
