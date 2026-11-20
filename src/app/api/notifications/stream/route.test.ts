/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET } from "./route";

const cookieGet = jest.fn();

jest.mock("next/headers", () => ({
  cookies: jest.fn(async () => ({
    get: cookieGet,
  })),
}));

describe("GET /api/notifications/stream", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("returns 401 when there is no session token", async () => {
    cookieGet.mockReturnValue(undefined);

    const response = await GET(new NextRequest("http://localhost/api/notifications/stream"));

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

    const response = await GET(
      new NextRequest("http://localhost/api/notifications/stream"),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/notifications\/stream$/),
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "text/event-stream",
          Authorization: "Bearer jwt-token",
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(response.headers.get("Cache-Control")).toBe("no-cache, no-transform");
  });

  it("forwards an upstream error response", async () => {
    cookieGet.mockReturnValue({ value: "jwt-token" });
    fetchMock.mockResolvedValue({
      ok: false,
      body: null,
      status: 503,
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    const response = await GET(
      new NextRequest("http://localhost/api/notifications/stream"),
    );

    expect(response.status).toBe(503);
  });
});
