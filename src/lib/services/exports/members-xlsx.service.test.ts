import { apiMock } from "@/lib/mocks/api.mock";
import { mockLoggedUser } from "@/lib/mocks/logged-user.mock";
import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import { Member } from "@/lib/models/member";
import { exportToExcel } from "./base-xlsx.service";
import { MembersXlsxService } from "./members-xlsx.service";

jest.mock("@/lib/client/axios", () => ({
  api: apiMock,
}));

jest.mock("./base-xlsx.service", () => ({
  exportToExcel: jest.fn(),
}));

const t = (key: string) => key;

function member(overrides: Partial<Member> = {}): Member {
  return {
    id: "01",
    active: true,
    createdAt: "2024-06-15T15:04:00.000Z",
    name: "Member 01",
    email: "member01@email.com",
    type: UserTypeEnum.MEMBER,
    ...overrides,
  };
}

function expectedRow(item: Member, locale: string) {
  return {
    name: item.name,
    email: item.email,
    created_at: new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(item.createdAt)),
  };
}

describe("MembersXlsxService", () => {
  const service = new MembersXlsxService();
  const locale = "en";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exports every member linked to the logged user", async () => {
    const members = [
      member(),
      member({ id: "02", name: "Member 02", email: "member02@email.com" }),
    ];
    apiMock.get.mockResolvedValue({ data: members });

    await service.exportAll({ locale, t });

    expect(apiMock.get).toHaveBeenCalledWith(
      `/members/list-all/${mockLoggedUser.id}`,
    );
    expect(exportToExcel).toHaveBeenCalledWith(
      members.map((item) => expectedRow(item, locale)),
      "members",
    );
  });

  it("exports the members already loaded on the current page", () => {
    const members = [member()];

    service.exportCurrentPage({ locale, t, data: members });

    expect(apiMock.get).not.toHaveBeenCalled();
    expect(apiMock.post).not.toHaveBeenCalled();
    expect(exportToExcel).toHaveBeenCalledWith(
      [expectedRow(members[0], locale)],
      "members",
    );
  });

  it("exports the members selected by id, sorted by name", async () => {
    const alpha = member({ id: "01", name: "Alpha", email: "alpha@email.com" });
    const zeta = member({ id: "02", name: "Zeta", email: "zeta@email.com" });
    apiMock.post.mockResolvedValue({ data: [zeta, alpha] });

    await service.exportSelected({ locale, t, dataIds: ["02", "01"] });

    expect(apiMock.post).toHaveBeenCalledWith(
      `/members/list-by-ids/${mockLoggedUser.id}`,
      { ids: ["02", "01"] },
    );
    expect(exportToExcel).toHaveBeenCalledWith(
      [expectedRow(alpha, locale), expectedRow(zeta, locale)],
      "members",
    );
  });
});
