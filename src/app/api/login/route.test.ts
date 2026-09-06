/**
 * @jest-environment node
 */
import { POST } from "./route";

const cookieSet = jest.fn();

jest.mock("next/headers", () => ({
  cookies: jest.fn(async () => ({
    set: cookieSet,
  })),
}));

describe("POST /api/login", () => {
  it("stores the JWT as an httpOnly cookie until the end of the day", async () => {
    const response = await POST(
      new Request("http://localhost/api/login", {
        method: "POST",
        body: "jwt-token",
      }),
    );

    expect(cookieSet).toHaveBeenCalledWith(
      "token",
      "jwt-token",
      expect.objectContaining({
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      }),
    );
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
