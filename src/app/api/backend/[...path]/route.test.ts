/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { DELETE, GET, PATCH, POST, PUT } from "./route";

const cookieGet = jest.fn();

jest.mock("next/headers", () => ({
  cookies: jest.fn(async () => ({
    get: cookieGet,
  })),
}));

describe("backend proxy", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    cookieGet.mockReturnValue({ value: "jwt-token" });
    fetchMock.mockResolvedValue({
      status: 200,
      text: async () => JSON.stringify({ ok: true }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  const context = {
    params: Promise.resolve({ path: ["clients", "list", "01"] }),
  };

  it("forwards GET requests without a body and with the session token", async () => {
    const request = new NextRequest(
      "http://localhost/api/backend/clients/list/01?query=jane",
    );

    const response = await GET(request, context);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/clients\/list\/01\?query=jane$/),
      expect.objectContaining({
        method: "GET",
        body: undefined,
        headers: expect.any(Headers),
      }),
    );

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.get("Authorization")).toBe("Bearer jwt-token");
    expect(init.headers.get("X-Forwarded-For")).toBeNull();
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("forwards the browser IP from the first forwarded address", async () => {
    const request = new NextRequest("http://localhost/api/backend/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "198.51.100.10, 10.0.0.8",
      },
      body: JSON.stringify({ email: "user@email.com" }),
    });

    await POST(request, {
      params: Promise.resolve({ path: ["auth", "login"] }),
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.get("X-Forwarded-For")).toBe("198.51.100.10");
  });

  it("does not forward a non-IP client address", async () => {
    const request = new NextRequest("http://localhost/api/backend/auth/login", {
      method: "POST",
      headers: { "x-forwarded-for": "not-an-ip" },
      body: "{}",
    });

    await POST(request, {
      params: Promise.resolve({ path: ["auth", "login"] }),
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.get("X-Forwarded-For")).toBeNull();
  });

  it("copies Retry-After from a rate-limited API response", async () => {
    fetchMock.mockResolvedValue({
      status: 429,
      text: async () =>
        JSON.stringify({ code: "RATE_LIMIT", detail: "Too many requests. Try again later." }),
      headers: new Headers({
        "Content-Type": "application/json",
        "Retry-After": "30",
      }),
    });

    const response = await POST(
      new NextRequest("http://localhost/api/backend/auth/login", {
        method: "POST",
        body: "{}",
      }),
      { params: Promise.resolve({ path: ["auth", "login"] }) },
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
  });

  it("forwards POST bodies and content type", async () => {
    const request = new NextRequest("http://localhost/api/backend/clients/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Client" }),
    });

    await POST(request, {
      params: Promise.resolve({ path: ["clients", "upsert"] }),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/clients\/upsert$/),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Client" }),
      }),
    );
  });

  it("exposes PUT, PATCH and DELETE helpers", async () => {
    const request = new NextRequest("http://localhost/api/backend/x", {
      method: "PUT",
      body: "{}",
    });
    const emptyContext = { params: Promise.resolve({ path: ["x"] }) };

    await PUT(request, emptyContext);
    await PATCH(
      new NextRequest("http://localhost/api/backend/x", {
        method: "PATCH",
        body: "{}",
      }),
      emptyContext,
    );
    await DELETE(
      new NextRequest("http://localhost/api/backend/x", { method: "DELETE" }),
      emptyContext,
    );

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
