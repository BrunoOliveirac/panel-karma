import { mockLoggedUser } from "@/lib/mocks/logged-user.mock";
import { apiMock } from "@/lib/mocks/api.mock";
import { Sector } from "@/lib/models/sector";
import { SectorService } from "./sector.service";

jest.mock("@/lib/client/axios", () => ({
  api: require("@/lib/mocks/api.mock").apiMock,
}));

describe("SectorService", () => {
  const service = new SectorService();

  it("lists sectors for the logged user", async () => {
    apiMock.get.mockResolvedValue({ data: [{ id: "s1" }] });
    await expect(service.getAllSectors()).resolves.toEqual([{ id: "s1" }]);
    expect(apiMock.get).toHaveBeenCalledWith(
      `/sectors/list/${mockLoggedUser.id}`,
    );
  });

  it("lists active sectors for the logged user", async () => {
    apiMock.get.mockResolvedValue({ data: [{ id: "s1" }] });
    await expect(service.getAllActiveSectors()).resolves.toEqual([{ id: "s1" }]);
    expect(apiMock.get).toHaveBeenCalledWith(
      `/sectors/list-actives/${mockLoggedUser.id}`,
    );
  });

  it("upserts a sector with the logged user id", async () => {
    apiMock.post.mockResolvedValue({ data: "s1" });
    const sector = { id: "s1", name: "Finance" } as Sector;

    await expect(service.upsertSector(sector)).resolves.toBe("s1");
    expect(apiMock.post).toHaveBeenCalledWith("/sectors/upsert", {
      ...sector,
      userId: mockLoggedUser.id,
    });
  });

  it("deletes a sector", async () => {
    apiMock.delete.mockResolvedValue({});
    await service.deleteSector("s1");
    expect(apiMock.delete).toHaveBeenCalledWith("/sectors/delete/s1");
  });
});
