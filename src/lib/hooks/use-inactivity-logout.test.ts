import { act, renderHook } from "@testing-library/react";
import { mockLoggedUser } from "@/lib/mocks/logged-user.mock";
import { useLoggedUserStore } from "@/lib/store/use-logged-user-store";
import { useInactivityLogout } from "./use-inactivity-logout";

const replaceMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

describe("useInactivityLogout", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock.mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("logs out after the inactivity timeout", async () => {
    renderHook(() => useInactivityLogout(3));

    await act(async () => {
      jest.advanceTimersByTime(3 * 60 * 60 * 1000);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/logout", {
      method: "POST",
      credentials: "include",
    });
    expect(useLoggedUserStore.getState().user).toBeNull();
    expect(replaceMock).toHaveBeenCalledWith("/login");
  });

  it("resets the timer on user activity", async () => {
    renderHook(() => useInactivityLogout(3));

    await act(async () => {
      jest.advanceTimersByTime(2 * 60 * 60 * 1000);
      window.dispatchEvent(new Event("mousemove"));
      jest.advanceTimersByTime(2 * 60 * 60 * 1000);
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(useLoggedUserStore.getState().user).toEqual(mockLoggedUser);
  });
});
