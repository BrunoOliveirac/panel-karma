"use client";

import {
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { LoggedUser } from "../types/logged-user";
import { LocaleType } from "../types/locale-type";

interface FetchAuth {
  user: LoggedUser;
  expiresAt: Date;
  locale: LocaleType;
}

function fetchAuth(): FetchAuth {
  const user = Cookies.get("user");
  const expiresAt = Cookies.get("expiresAt");
  const locale = Cookies.get("locale") as LocaleType | undefined;

  if (!expiresAt || !user) throw new Error("Unauthenticated");

  return {
    user: JSON.parse(user),
    locale: locale || "en",
    expiresAt: JSON.parse(expiresAt),
  };
}

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const hasRedirected = useRef(false);

  const query: UseQueryResult<FetchAuth, Error> = useQuery({
    retry: false,
    queryKey: ["auth"],
    queryFn: fetchAuth,
    staleTime: Infinity,
    refetchOnWindowFocus: true,
  });

  // Automatic timer based on the expiration date
  useEffect(() => {
    const expiresAt = query?.data?.expiresAt;
    if (!expiresAt) return;

    const now = Date.now();
    const timeLeft = new Date(expiresAt).getTime() - now;
    function logout() {
      hasRedirected.current = true;
      Cookies.remove("token");
      Cookies.remove("user");
      Cookies.remove("expiresAt");
      queryClient.clear();
      router.replace("/login");
    }

    if (timeLeft <= 0) {
      logout();
      return;
    }

    const timeout = setTimeout(() => {
      logout();
    }, timeLeft);

    return () => clearTimeout(timeout);
  }, [query?.data?.expiresAt, router, queryClient]);

  // When the backend invalidates before the token expires
  // useEffect(() => {
  //   if (query.isError && !hasRedirected.current) {
  //     hasRedirected.current = true;
  //     Cookies.remove("token");
  //     Cookies.remove("user");
  //     Cookies.remove("expiresAt");
  //     queryClient.clear();
  //     router.replace("/login");
  //   }
  // }, [query.isError, router, queryClient]);

  return query ?? {};
}
