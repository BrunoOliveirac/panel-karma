"use client";

import {
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { endOfDay } from "date-fns";
import Cookies from "js-cookie";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { UserRouteMap } from "../enums/user-type.enum";
import { SidebarItemMock } from "../mocks/sidebar-item.mock";
import { ProfileService } from "../services/profile.service";
import { useLoggedUserStore } from "../store/use-logged-user-store";
import { LocaleType } from "../types/locale-type";
import { LoggedUser } from "../types/logged-user";

interface FetchAuth {
  user: LoggedUser;
  locale: LocaleType;
}

async function fetchAuth(): Promise<FetchAuth> {
  const user = await new ProfileService().getProfile();
  useLoggedUserStore.getState().setUser(user);

  const locale = (Cookies.get("locale") as LocaleType | undefined) || "en";

  return { user, locale };
}

async function clearSession() {
  await fetch("/api/logout", {
    method: "POST",
    credentials: "include",
  });
  useLoggedUserStore.getState().setUser(null);
}

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const [sessionExpired, setSessionExpired] = useState(false);

  const query: UseQueryResult<FetchAuth, Error> = useQuery({
    retry: false,
    queryKey: ["auth"],
    queryFn: fetchAuth,
    staleTime: Infinity,
    enabled: !sessionExpired,
    refetchOnWindowFocus: !sessionExpired,
  });

  // Redirect based on user type after profile is loaded
  useEffect(() => {
    if (sessionExpired) return;

    const user = query.data?.user;
    if (!user) return;

    const home = UserRouteMap.get(user.type) ?? "/home";

    if (!new SidebarItemMock().isAllowed(user.type, pathname) && pathname !== home) {
      router.replace(home);
    }
  }, [query.data?.user, pathname, router, sessionExpired]);

  // If /profile fails, clear session and go to login
  useEffect(() => {
    if (!query.isError || sessionExpired) return;

    (async () => {
      await clearSession();
      queryClient.clear();
      router.replace("/login");
    })();
  }, [query.isError, queryClient, router, sessionExpired]);

  // Expire session at midnight (token is issued until end of day)
  useEffect(() => {
    if (!query.data?.user || sessionExpired) return;

    const timeLeft = endOfDay(new Date()).getTime() - Date.now();

    async function expireSession() {
      setSessionExpired(true);
      await clearSession();
    }

    if (timeLeft <= 0) {
      expireSession();
      return;
    }

    const timeout = setTimeout(expireSession, timeLeft);
    return () => clearTimeout(timeout);
  }, [query.data?.user, sessionExpired]);

  const acknowledgeSessionExpired = useCallback(() => {
    queryClient.clear();
    router.replace("/login");
  }, [queryClient, router]);

  return {
    ...query,
    sessionExpired,
    acknowledgeSessionExpired,
  };
}
