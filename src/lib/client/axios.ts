import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

const queryClient = new QueryClient();

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
});

// Interceptor to add the token to the request
api.interceptors.request.use(async (config) => {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      queryClient.clear();

      document.cookie =
        "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);
