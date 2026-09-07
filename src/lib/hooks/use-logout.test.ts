import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { mockLoggedUser } from "@/lib/mocks/logged-user.mock";
import { useLoggedUserStore } from "@/lib/store/use-logged-user-store";
import { useLogout } from "./use-logout";

const replaceMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

describe("useLogout", () => {
  const fetchMock = jest.fn();
  const queryClient = new QueryClient();
  const clearSpy = jest.spyOn(queryClient, "clear");

  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  beforeEach(() => {
    fetchMock.mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("clears the session and redirects to login", async () => {
    expect(useLoggedUserStore.getState().user).toEqual(mockLoggedUser);

    const { result } = renderHook(() => useLogout(), { wrapper });
    await result.current();

    expect(fetchMock).toHaveBeenCalledWith("/api/logout", {
      method: "POST",
      credentials: "include",
    });
    expect(useLoggedUserStore.getState().user).toBeNull();
    expect(clearSpy).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith("/login");
  });
});
