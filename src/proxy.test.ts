/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

let tokenCookie: { value: string } | undefined;

jest.mock("next/headers", () => ({
  cookies: jest.fn(async () => ({
    get: () => tokenCookie,
  })),
}));

describe("proxy", () => {
  it("redirects unauthenticated users away from protected routes", async () => {
    tokenCookie = undefined;
    const response = await proxy(new NextRequest("http://localhost/clients"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/login");
  });

  it("allows unauthenticated access to login and register", async () => {
    tokenCookie = undefined;
    const response = await proxy(new NextRequest("http://localhost/login"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("sends authenticated users away from auth routes", async () => {
    tokenCookie = { value: "jwt-token" };
    const response = await proxy(new NextRequest("http://localhost/register"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/");
  });

  it("lets authenticated users through protected routes", async () => {
    tokenCookie = { value: "jwt-token" };
    const response = await proxy(new NextRequest("http://localhost/clients"));

    expect(response.headers.get("location")).toBeNull();
  });
});
