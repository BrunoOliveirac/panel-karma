import { apiMock } from "@/lib/mocks/api.mock";
import { SupportService } from "./support.service";

jest.mock("@/lib/client/axios", () => ({
  api: require("@/lib/mocks/api.mock").apiMock,
}));

describe("SupportService", () => {
  const service = new SupportService();

  it("lists supports", async () => {
    apiMock.get.mockResolvedValue({ data: [{ id: "s1" }] });
    await expect(service.getAllSupports()).resolves.toEqual([{ id: "s1" }]);
    expect(apiMock.get).toHaveBeenCalledWith("/supports/list");
  });

  it("upserts a support", async () => {
    apiMock.post.mockResolvedValue({ data: "s1" });
    await expect(
      service.upsertSupport({ name: "Support", email: "s@email.com" }),
    ).resolves.toBe("s1");
    expect(apiMock.post).toHaveBeenCalledWith("/supports/upsert", {
      name: "Support",
      email: "s@email.com",
    });
  });

  it("checks email availability", async () => {
    apiMock.post.mockResolvedValue({ data: true });
    await expect(service.checkEmail("s@email.com", "s1")).resolves.toBe(true);
    expect(apiMock.post).toHaveBeenCalledWith("/supports/check-email", {
      email: "s@email.com",
      supportId: "s1",
    });
  });

  it("toggles status, updates password and deletes a support", async () => {
    apiMock.patch.mockResolvedValue({});
    apiMock.delete.mockResolvedValue({});

    await service.toggleStatus("s1");
    await service.updatePassword("s1", "Password1!");
    await service.deleteSupport("s1");

    expect(apiMock.patch).toHaveBeenCalledWith("/supports/toggle-status/s1");
    expect(apiMock.patch).toHaveBeenCalledWith("/supports/update-password/s1", {
      password: "Password1!",
    });
    expect(apiMock.delete).toHaveBeenCalledWith("/supports/delete/s1");
  });
});
