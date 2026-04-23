import { useAuth } from "@/lib/hooks/use-auth";
import { useLocale } from "@/lib/hooks/use-locale";
import { useLogout } from "@/lib/hooks/use-logout";
import { SidebarItemMock } from "@/lib/mocks/sidebar-item.mock";
import { LocaleOptions, LocaleType } from "@/lib/types/locale-type";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import Cookies from "js-cookie";

export default function Sidebar() {
  const router = useRouter();
  const { data, refetch } = useAuth();
  const logout = useLogout();
  const languages = LocaleOptions;
  const t = useTranslations("sidebar");
  const { changeLocale } = useLocale();
  const sidebarItems = new SidebarItemMock().get(data!.user!.type);
  const [selectedLocale, setSelectedLocale] = useState(data?.locale);

  const changeLanguage = (locale: LocaleType) => {
    setSelectedLocale(locale);
    changeLocale(locale);
    Cookies.set("locale", locale);
    refetch();
  };

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

        <div className="flex flex-col items-center gap-4 overflow-y-auto h-[calc(100dvh-164px)] pt-6">
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
        <Popover>
          <PopoverTrigger asChild>
            <button key={selectedLocale}>
              <Image
                width={20}
                height={13}
                alt={`${selectedLocale} flag`}
                src={`/images/flags/${selectedLocale}.svg`}
              />
            </button>
          </PopoverTrigger>

          <PopoverContent side="right">
            <div className="flex gap-4">
              {languages.map((language) => (
                <button key={language}>
                  <Image
                    width={20}
                    height={13}
                    alt={`${language} flag`}
                    src={`/images/flags/${language}.svg`}
                    onClick={() => changeLanguage(language)}
                  />
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

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
