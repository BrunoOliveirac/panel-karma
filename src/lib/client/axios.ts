import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

const queryClient = new QueryClient();

export const api = axios.create({
  baseURL: "/api/backend",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const requestUrl = String(error.config?.url ?? "");
    const isAuthAttempt =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register");

    // Login/register 401s are handled by the form; do not force a session reset.
    if (status === 401 && !isAuthAttempt) {
      queryClient.clear();

      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);
