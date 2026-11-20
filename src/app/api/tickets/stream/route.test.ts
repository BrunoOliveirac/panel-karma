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

describe("GET /api/tickets/stream", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("proxies the session to the ticket stream", async () => {
    cookieGet.mockReturnValue({ value: "jwt-token" });
    fetchMock.mockResolvedValue({
      ok: true,
      body: new ReadableStream(),
      status: 200,
      headers: new Headers({ "Content-Type": "text/event-stream" }),
    });

    const response = await GET(
      new NextRequest("http://localhost/api/tickets/stream"),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/tickets\/stream$/),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-token",
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
  });
});
