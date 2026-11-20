import * as sanitize from "@/lib/utils/sanitize-html";
import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { api } from "./axios";

describe("api interceptors", () => {
  const originalAdapter = api.defaults.adapter;
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    api.defaults.adapter = originalAdapter;
  });

  const parseBody = (data: unknown) =>
    typeof data === "string" ? JSON.parse(data) : data;

  const okAdapter =
    (inspect: (config: InternalAxiosRequestConfig) => void): AxiosAdapter =>
    async (config) => {
      inspect(config);
      return {
        data: { ok: true },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };

  it("strips HTML from JSON request bodies", async () => {
    let captured: unknown;
    api.defaults.adapter = okAdapter((config) => {
      captured = parseBody(config.data);
    });

    await api.post("/clients", { name: "<b>Client</b>" });
    expect(captured).toEqual({ name: "Client" });
  });

  it("does not strip the avatar field", async () => {
    let captured: unknown;
    api.defaults.adapter = okAdapter((config) => {
      captured = parseBody(config.data);
    });

    await api.put("/profile", {
      name: "<b>User</b>",
      avatar: "data:image/jpeg;base64,<svg>x</svg>",
    });

    expect(captured).toEqual({
      name: "User",
      avatar: "data:image/jpeg;base64,<svg>x</svg>",
    });
  });

  it("leaves FormData bodies untouched", async () => {
    const formData = new FormData();
    formData.append("file", "value");
    const spy = jest.spyOn(sanitize, "stripHtmlDeep");
    api.defaults.adapter = okAdapter(() => undefined);

    await api.post("/upload", formData);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("strips HTML from query params", async () => {
    let captured: unknown;
    api.defaults.adapter = okAdapter((config) => {
      captured = config.params;
    });

    await api.get("/search", { params: { query: "<i>karma</i>" } });
    expect(captured).toEqual({ query: "karma" });
  });

  it("logs out on a 401 that is not login or register", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    api.defaults.adapter = async (config) => {
      return Promise.reject({
        response: { status: 401 },
        config: { ...config, url: "/clients/list/01" },
        isAxiosError: true,
      });
    };

    await expect(api.get("/clients/list/01")).rejects.toBeDefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/logout", {
      method: "POST",
      credentials: "include",
    });
    consoleSpy.mockRestore();
  });

  it("does not reset the session on a login 401", async () => {
    api.defaults.adapter = async (config) => {
      return Promise.reject({
        response: { status: 401 },
        config: { ...config, url: "/auth/login" },
        isAxiosError: true,
      });
    };

    await expect(
      api.post("/auth/login", { email: "a@b.c", password: "x" }),
    ).rejects.toBeDefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
