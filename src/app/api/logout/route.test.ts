/**
 * @jest-environment node
 */
import { POST } from "./route";

const cookieGet = jest.fn();
const cookieDelete = jest.fn();

jest.mock("next/headers", () => ({
  cookies: jest.fn(async () => ({
    get: cookieGet,
    delete: cookieDelete,
  })),
}));

describe("POST /api/logout", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("revokes the token on the API and clears the cookie", async () => {
    cookieGet.mockReturnValue({ value: "jwt-token" });

    const response = await POST();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/logout$/),
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer jwt-token" },
      }),
    );
    expect(cookieDelete).toHaveBeenCalledWith({ name: "token", path: "/" });
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("clears the cookie even when there is no token", async () => {
    cookieGet.mockReturnValue(undefined);

    await POST();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(cookieDelete).toHaveBeenCalledWith({ name: "token", path: "/" });
  });

  it("still clears the cookie when the API revoke fails", async () => {
    cookieGet.mockReturnValue({ value: "jwt-token" });
    fetchMock.mockRejectedValue(new Error("offline"));

    await POST();

    expect(cookieDelete).toHaveBeenCalledWith({ name: "token", path: "/" });
  });
});
