/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { proxyEventStream } from "./proxy-event-stream";

const cookieGet = jest.fn();

jest.mock("next/headers", () => ({
  cookies: jest.fn(async () => ({
    get: cookieGet,
  })),
}));

describe("proxyEventStream", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("returns 401 when there is no session token", async () => {
    cookieGet.mockReturnValue(undefined);

    const response = await proxyEventStream(
      new NextRequest("http://localhost/api/tickets/stream"),
      "/tickets/stream",
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("proxies a successful SSE stream", async () => {
    cookieGet.mockReturnValue({ value: "jwt-token" });
    const body = new ReadableStream();
    fetchMock.mockResolvedValue({
      ok: true,
      body,
      status: 200,
      headers: new Headers({ "Content-Type": "text/event-stream" }),
    });

    const response = await proxyEventStream(
      new NextRequest("http://localhost/api/tickets/stream"),
      "/tickets/stream",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/tickets\/stream$/),
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "text/event-stream",
          Authorization: "Bearer jwt-token",
        }),
        cache: "no-store",
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(response.headers.get("Cache-Control")).toBe("no-cache, no-transform");
    expect(response.headers.get("Connection")).toBe("keep-alive");
    expect(response.headers.get("X-Accel-Buffering")).toBe("no");
  });

  it("forwards an upstream error response", async () => {
    cookieGet.mockReturnValue({ value: "jwt-token" });
    fetchMock.mockResolvedValue({
      ok: false,
      body: null,
      status: 503,
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    const response = await proxyEventStream(
      new NextRequest("http://localhost/api/notifications/stream"),
      "/notifications/stream",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/notifications\/stream$/),
      expect.anything(),
    );
    expect(response.status).toBe(503);
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });
});
