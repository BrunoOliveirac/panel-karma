import { mockLoggedUser } from "@/lib/mocks/logged-user.mock";
import { apiMock } from "@/lib/mocks/api.mock";
import { ClientService } from "./client.service";

jest.mock("@/lib/client/axios", () => ({
  api: require("@/lib/mocks/api.mock").apiMock,
}));

describe("ClientService", () => {
  const service = new ClientService();

  it("lists clients for the logged user", async () => {
    apiMock.get.mockResolvedValue({ data: [{ id: "01" }] });

    await expect(service.getAllClients()).resolves.toEqual([{ id: "01" }]);
    expect(apiMock.get).toHaveBeenCalledWith(`/clients/list/${mockLoggedUser.id}`);
  });

  it("checks whether an email is available", async () => {
    apiMock.post.mockResolvedValue({ data: true });

    await expect(service.checkEmail("client@email.com")).resolves.toBe(true);
    expect(apiMock.post).toHaveBeenCalledWith("/clients/check-email", {
      email: "client@email.com",
      userId: mockLoggedUser.id,
    });
  });

  it("upserts a client with the logged user id", async () => {
    apiMock.post.mockResolvedValue({ data: "01" });
    const payload = {
      name: "Client",
      email: "client@email.com",
      phone: "12345678",
      budget: 100,
    };

    await expect(service.upsertClient(payload)).resolves.toBe("01");
    expect(apiMock.post).toHaveBeenCalledWith("/clients/upsert", {
      ...payload,
      userId: mockLoggedUser.id,
    });
  });

  it("toggles a client favorite", async () => {
    apiMock.patch.mockResolvedValue({});
    await service.toggleFavorite("01", true);
    expect(apiMock.patch).toHaveBeenCalledWith("/clients/favorite/01", true);
  });

  it("deletes a client", async () => {
    apiMock.delete.mockResolvedValue({});
    await service.deleteClient("01");
    expect(apiMock.delete).toHaveBeenCalledWith("/clients/delete/01");
  });
});
