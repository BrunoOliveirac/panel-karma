"use client";

import {
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { endOfDay } from "date-fns";
import Cookies from "js-cookie";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
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

  const query: UseQueryResult<FetchAuth, Error> = useQuery({
    retry: false,
    queryKey: ["auth"],
    queryFn: fetchAuth,
    staleTime: Infinity,
    refetchOnWindowFocus: true,
  });

  // Redirect based on user type after profile is loaded
  useEffect(() => {
    const user = query.data?.user;
    if (!user) return;

    const home = UserRouteMap.get(user.type) ?? "/home";
    const allowedPaths = new SidebarItemMock().getPaths(user.type);

    if (pathname === "/" || !allowedPaths.includes(pathname)) {
      if (pathname !== home) {
        router.replace(home);
      }
    }
  }, [query.data?.user, pathname, router]);

  // If /profile fails, clear session and go to login
  useEffect(() => {
    if (!query.isError) return;

    (async () => {
      await clearSession();
      queryClient.clear();
      router.replace("/login");
    })();
  }, [query.isError, queryClient, router]);

  // Logout when JWT day expires (token is issued until end of day)
  useEffect(() => {
    if (!query.data?.user) return;

    const timeLeft = endOfDay(new Date()).getTime() - Date.now();

    async function logout() {
      await clearSession();
      queryClient.clear();
      router.replace("/login");
    }

    if (timeLeft <= 0) {
      logout();
      return;
    }

    const timeout = setTimeout(logout, timeLeft);
    return () => clearTimeout(timeout);
  }, [query.data?.user, router, queryClient]);

  return query ?? {};
}
