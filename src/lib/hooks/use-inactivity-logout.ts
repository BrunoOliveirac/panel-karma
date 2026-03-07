"use client";

import { QueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function useInactivityLogout(hours = 3) {
  const router = useRouter();
  const timeout = hours * 60 * 60 * 1000;
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const queryClient = new QueryClient();

    const logout = () => {
      Cookies.remove("token");
      Cookies.remove("user");
      Cookies.remove("expiresAt");
      queryClient.clear();
      router.replace("/login");
    };

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    const resetTimer = () => {
      if (timer.current) clearTimeout(timer.current);

      timer.current = setTimeout(() => {
        logout();
      }, timeout);
    };

    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [router, timeout]);
}
