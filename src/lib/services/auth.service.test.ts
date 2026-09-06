import { apiMock } from "@/lib/mocks/api.mock";
import { AuthService } from "./auth.service";

jest.mock("@/lib/client/axios", () => ({
  api: require("@/lib/mocks/api.mock").apiMock,
}));

describe("AuthService", () => {
  const fetchMock = jest.fn();
  const service = new AuthService();

  beforeEach(() => {
    fetchMock.mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
    apiMock.post.mockResolvedValue({ data: "jwt-token" });
  });

  it("logs in and persists the token cookie", async () => {
    await service.login({ email: "user@email.com", password: "password1" });

    expect(apiMock.post).toHaveBeenCalledWith("/auth/login", {
      email: "user@email.com",
      password: "password1",
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/login", {
      method: "POST",
      credentials: "include",
      body: "jwt-token",
    });
  });

  it("registers and persists the token cookie", async () => {
    await service.register({
      name: "Jane",
      email: "jane@email.com",
      password: "Password1!",
    });

    expect(apiMock.post).toHaveBeenCalledWith("/auth/register", {
      name: "Jane",
      email: "jane@email.com",
      password: "Password1!",
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/login", {
      method: "POST",
      credentials: "include",
      body: "jwt-token",
    });
  });

  it("persists a token without calling the auth API", async () => {
    await service.persistToken("fresh-token");

    expect(apiMock.post).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith("/api/login", {
      method: "POST",
      credentials: "include",
      body: "fresh-token",
    });
  });
});
