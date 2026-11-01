import { apiMock } from "@/lib/mocks/api.mock";
import { mockLoggedUser } from "@/lib/mocks/logged-user.mock";
import { Sector } from "@/lib/models/sector";
import { exportToExcel } from "./base-xlsx.service";
import { SectorsXlsxService } from "./sectors-xlsx.service";

jest.mock("@/lib/client/axios", () => ({
  api: apiMock,
}));

jest.mock("./base-xlsx.service", () => ({
  exportToExcel: jest.fn(),
}));

const t = (key: string) => key;

function sector(overrides: Partial<Sector> = {}): Sector {
  return {
    id: "01",
    active: true,
    createdAt: "2024-06-15T15:04:00.000Z",
    name: "Sector 01",
    userId: "01",
    ...overrides,
  };
}

function expectedRow(item: Sector, locale: string) {
  return {
    name: item.name,
    status: item.active ? "active" : "inactive",
    created_at: new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(item.createdAt)),
  };
}

describe("SectorsXlsxService", () => {
  const service = new SectorsXlsxService();
  const locale = "en";

  it("exports every sector of the logged user", async () => {
    const sectors = [
      sector(),
      sector({ id: "02", active: false, name: "Sector 02" }),
    ];
    apiMock.get.mockResolvedValue({ data: sectors });

    await service.exportAll({ locale, t });

    expect(apiMock.get).toHaveBeenCalledWith(
      `/sectors/list/${mockLoggedUser.id}`,
    );
    expect(exportToExcel).toHaveBeenCalledWith(
      sectors.map((item) => expectedRow(item, locale)),
      "sectors",
    );
  });

  it("exports the sectors already loaded on the current page", () => {
    const sectors = [sector({ active: false })];

    service.exportCurrentPage({ locale, t, data: sectors });

    expect(apiMock.get).not.toHaveBeenCalled();
    expect(apiMock.post).not.toHaveBeenCalled();
    expect(exportToExcel).toHaveBeenCalledWith(
      [expectedRow(sectors[0], locale)],
      "sectors",
    );
  });

  it("exports the sectors selected by id, sorted by name", async () => {
    const alpha = sector({ id: "01", name: "Alpha" });
    const zeta = sector({ id: "02", name: "Zeta" });
    apiMock.post.mockResolvedValue({ data: [zeta, alpha] });

    await service.exportSelected({ locale, t, dataIds: ["02", "01"] });

    expect(apiMock.post).toHaveBeenCalledWith("/sectors/list-by-ids", {
      ids: ["02", "01"],
    });
    expect(exportToExcel).toHaveBeenCalledWith(
      [expectedRow(alpha, locale), expectedRow(zeta, locale)],
      "sectors",
    );
  });
});
