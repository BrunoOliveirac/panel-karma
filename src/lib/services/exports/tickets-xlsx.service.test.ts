import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import { TicketStatusEnum } from "@/lib/enums/ticket-status.enum";
import { apiMock } from "@/lib/mocks/api.mock";
import {
  mockLoggedUser,
  setMockLoggedUser,
} from "@/lib/mocks/logged-user.mock";
import { Ticket } from "@/lib/models/ticket";
import { exportToExcel } from "./base-xlsx.service";
import { TicketsXlsxService } from "./tickets-xlsx.service";

jest.mock("@/lib/client/axios", () => ({
  api: apiMock,
}));

jest.mock("./base-xlsx.service", () => ({
  exportToExcel: jest.fn(),
}));

const t = (key: string) => key;

function ticket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: "t1",
    active: true,
    createdAt: "2024-06-15T15:04:00.000Z",
    updatedAt: "2024-06-15T15:04:00.000Z",
    title: "Printer",
    description: "Paper jam",
    status: TicketStatusEnum.OPEN,
    userId: mockLoggedUser.id,
    userName: "Ana Costa",
    userAvatar: null,
    supportId: null,
    supportName: null,
    supportAvatar: null,
    code: 8,
    ...overrides,
  };
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function expectedRow(item: Ticket, locale: string) {
  return {
    code: item.code == null ? "-" : `#${String(item.code).padStart(2, "0")}`,
    title: item.title,
    description: item.description,
    user: item.userName || "-",
    status: item.status.toLowerCase(),
    assignee: item.supportName || "-",
    created_at: formatDate(item.createdAt, locale),
    assignee_date: formatDate(item.acceptedAt, locale),
    completion_date: formatDate(item.finishedAt, locale),
  };
}

describe("TicketsXlsxService", () => {
  const service = new TicketsXlsxService();
  const locale = "en";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exports every ticket visible to the logged user", async () => {
    const tickets = [ticket(), ticket({ id: "t2", code: 9, title: "Network" })];
    apiMock.get.mockResolvedValue({ data: tickets });

    await service.exportAll({ locale, t });

    expect(apiMock.get).toHaveBeenCalledWith("/tickets/list-all", {
      params: { userId: mockLoggedUser.id },
    });
    expect(exportToExcel).toHaveBeenCalledWith(
      [expectedRow(tickets[1], locale), expectedRow(tickets[0], locale)],
      "tickets",
    );
  });

  it("exports every ticket visible to support", async () => {
    setMockLoggedUser({
      ...mockLoggedUser,
      id: "s1",
      type: UserTypeEnum.SUPPORT,
    });
    apiMock.get.mockResolvedValue({ data: [ticket()] });

    await service.exportAll({ locale, t });

    expect(apiMock.get).toHaveBeenCalledWith("/tickets/list-all", {
      params: { supportId: "s1" },
    });
  });

  it("exports the tickets already loaded on the current page", () => {
    const tickets = [
      ticket({
        acceptedAt: "2024-06-16T12:00:00.000Z",
        finishedAt: "2024-06-17T18:30:00.000Z",
        supportName: "Bruno",
        status: TicketStatusEnum.RESOLVED,
      }),
    ];

    service.exportCurrentPage({ locale, t, data: tickets });

    expect(apiMock.get).not.toHaveBeenCalled();
    expect(apiMock.post).not.toHaveBeenCalled();
    expect(exportToExcel).toHaveBeenCalledWith(
      [expectedRow(tickets[0], locale)],
      "tickets",
    );
  });

  it("exports the tickets selected by id, highest code first", async () => {
    const later = ticket({ id: "t9", code: 12, title: "Later" });
    const earlier = ticket({ id: "t2", code: 2, title: "Earlier" });
    apiMock.post.mockResolvedValue({ data: [later, earlier] });

    await service.exportSelected({ locale, t, dataIds: ["t9", "t2"] });

    expect(apiMock.post).toHaveBeenCalledWith(
      "/tickets/list-by-ids",
      { ids: ["t9", "t2"] },
      { params: { userId: mockLoggedUser.id } },
    );
    expect(exportToExcel).toHaveBeenCalledWith(
      [expectedRow(later, locale), expectedRow(earlier, locale)],
      "tickets",
    );
  });
});
