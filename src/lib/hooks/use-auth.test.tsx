jest.unmock("@/lib/hooks/use-auth");

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import { clearMockLoggedUser } from "@/lib/mocks/logged-user.mock";
import { useLoggedUserStore } from "@/lib/store/use-logged-user-store";
import { useAuth } from "./use-auth";

const getProfileMock = jest.fn();
const replaceMock = jest.fn();
let pathname = "/clients";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => pathname,
}));

jest.mock("js-cookie", () => ({
  get: jest.fn(() => "en"),
}));

jest.mock("@/lib/services/profile.service", () => ({
  ProfileService: jest.fn().mockImplementation(() => ({
    getProfile: (...args: unknown[]) => getProfileMock(...args),
  })),
}));

const user = {
  id: "01",
  name: "Test User",
  email: "user@email.com",
  type: UserTypeEnum.USER,
};

describe("useAuth", () => {
  const fetchMock = jest.fn();

  const wrapper = ({ children }: { children: ReactNode }) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };

  beforeEach(() => {
    pathname = "/clients";
    fetchMock.mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
    getProfileMock.mockResolvedValue(user);
    clearMockLoggedUser();
  });

  it("loads the profile into the store", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.user).toEqual(user);
    expect(useLoggedUserStore.getState().user).toEqual(user);
  });

  it("redirects a user away from a path they cannot access", async () => {
    pathname = "/dashboard";
    renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/home");
    });
  });

  it("does not redirect when the path is allowed", async () => {
    renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(getProfileMock).toHaveBeenCalled();
    });

    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("clears the session and goes to login when the profile request fails", async () => {
    getProfileMock.mockRejectedValue(new Error("unauthorized"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });

    expect(useLoggedUserStore.getState().user).toBeNull();
    consoleSpy.mockRestore();
  });

  it("acknowledges an expired session by going to login", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    act(() => {
      result.current.acknowledgeSessionExpired();
    });

    expect(replaceMock).toHaveBeenCalledWith("/login");
  });
});
