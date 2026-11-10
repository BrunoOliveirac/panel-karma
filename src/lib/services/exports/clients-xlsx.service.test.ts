import { apiMock } from "@/lib/mocks/api.mock";
import { mockLoggedUser } from "@/lib/mocks/logged-user.mock";
import { Client } from "@/lib/models/client";
import { FormatCurrency } from "@/lib/utils/set-currency";
import { exportToExcel } from "./base-xlsx.service";
import { ClientsXlsxService } from "./clients-xlsx.service";

jest.mock("@/lib/client/axios", () => ({
  api: apiMock,
}));

jest.mock("./base-xlsx.service", () => ({
  exportToExcel: jest.fn(),
}));

const t = (key: string) => key;

function client(overrides: Partial<Client> = {}): Client {
  return {
    id: "01",
    active: true,
    createdAt: "2024-06-15T15:04:00.000Z",
    name: "Client 01",
    email: "client01@email.com",
    phone: "1234567890",
    notes: "Notes 01",
    userId: "01",
    budget: 175009,
    favorite: true,
    sector: {
      id: "s1",
      active: true,
      createdAt: "2024-01-01T00:00:00.000Z",
      name: "Sales",
      userId: "01",
    },
    ...overrides,
  };
}

function expectedRow(item: Client, locale: string) {
  return {
    name: item.name,
    email: item.email,
    phone: item.phone,
    sector: item.sector?.name ?? "",
    budget: FormatCurrency(item.budget),
    favorite: item.favorite ? "yes" : "no",
    notes: item.notes ?? "",
    created_at: new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(item.createdAt)),
  };
}

describe("ClientsXlsxService", () => {
  const service = new ClientsXlsxService();
  const locale = "en";

  it("exports every client of the logged user", async () => {
    const clients = [
      client(),
      client({ id: "02", favorite: false, name: "Client 02" }),
    ];
    apiMock.get.mockResolvedValue({ data: clients });

    await service.exportAll({ locale, t });

    expect(apiMock.get).toHaveBeenCalledWith(
      `/clients/list/${mockLoggedUser.id}`,
    );
    expect(exportToExcel).toHaveBeenCalledWith(
      clients.map((item) => expectedRow(item, locale)),
      "clients",
    );
  });

  it("exports an already loaded client scope without refetching", async () => {
    const clients = [client({ favorite: true })];

    await service.exportAll({ locale, t, data: clients });

    expect(apiMock.get).not.toHaveBeenCalled();
    expect(exportToExcel).toHaveBeenCalledWith(
      [expectedRow(clients[0], locale)],
      "clients",
    );
  });

  it("exports the clients already loaded on the current page", () => {
    const clients = [client({ favorite: false, sector: undefined })];

    service.exportCurrentPage({ locale, t, data: clients });

    expect(apiMock.get).not.toHaveBeenCalled();
    expect(apiMock.post).not.toHaveBeenCalled();
    expect(exportToExcel).toHaveBeenCalledWith(
      [expectedRow(clients[0], locale)],
      "clients",
    );
  });

  it("exports the clients selected by id, sorted by name", async () => {
    const alpha = client({ id: "01", name: "Alpha" });
    const zeta = client({ id: "02", name: "Zeta", favorite: false });
    apiMock.post.mockResolvedValue({ data: [zeta, alpha] });

    await service.exportSelected({ locale, t, dataIds: ["02", "01"] });

    expect(apiMock.post).toHaveBeenCalledWith("/clients/list-by-ids", {
      ids: ["02", "01"],
    });
    expect(exportToExcel).toHaveBeenCalledWith(
      [expectedRow(alpha, locale), expectedRow(zeta, locale)],
      "clients",
    );
  });
});
