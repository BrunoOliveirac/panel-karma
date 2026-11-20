"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useLoggedUserStore } from "../store/use-logged-user-store";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const logout = async () => {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    });

    useLoggedUserStore.setState({ user: null });
    queryClient.clear();
    router.replace("/login");
  };

  return logout;
}
