"use client";

import { useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const logout = () => {
    Cookies.remove("token");
    Cookies.remove("user");
    Cookies.remove("expiresAt");
    queryClient.clear();
    router.replace("/login");
  };

  return logout;
}
