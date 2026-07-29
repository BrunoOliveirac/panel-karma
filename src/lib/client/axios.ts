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
    if (error.response?.status === 401) {
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
