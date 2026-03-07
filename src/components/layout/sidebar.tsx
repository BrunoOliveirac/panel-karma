import { useAuth } from "@/lib/hooks/use-auth";
import { useLogout } from "@/lib/hooks/use-logout";
import { SidebarItemMock } from "@/lib/mocks/SidebarItemMock";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export default function Sidebar() {
  const router = useRouter();
  const { data } = useAuth();
  const logout = useLogout();
  const t = useTranslations("sidebar");
  const sidebarItems = new SidebarItemMock().get(data?.user?.type);

  return (
    <aside className="flex flex-1 flex-col justify-between items-center gap-4 min-w-12 py-4 bg-[#7c79d429] rounded-4xl">
      <div>
        <button
          onClick={() => router.push("/")}
          className="flex items-center mx-auto"
        >
          <Image
            alt="Logo"
            width={25}
            height={31}
            src="/images/logo-icon.svg"
          />
        </button>

        <div className="flex flex-col items-center gap-4 overflow-y-auto h-[calc(100dvh-120px)] pt-6">
          {sidebarItems.map((sidebarItem) => (
            <Tooltip key={sidebarItem.name}>
              <TooltipTrigger asChild>
                <Link
                  key={sidebarItem.name}
                  href={sidebarItem.path}
                  className="text-primary hover:text-primary/80 hover:scale-125 transition-transform"
                >
                  <sidebarItem.icon size={20} />
                </Link>
              </TooltipTrigger>

              <TooltipContent side="right">
                <p>{t(sidebarItem.name)}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-center items-center gap-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={() => logout()}>
              <LogOut className="text-primary" size={20} />
            </button>
          </TooltipTrigger>

          <TooltipContent side="right">
            <p>{t("logout")}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
