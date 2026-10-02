import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import { apiMock } from "@/lib/mocks/api.mock";
import {
  mockLoggedUser,
  setMockLoggedUser,
} from "@/lib/mocks/logged-user.mock";
import { TicketStatusEnum } from "../enums/ticket-status.enum";
import { TicketService } from "./ticket.service";

jest.mock("@/lib/client/axios", () => ({
  api: apiMock,
}));

describe("TicketService", () => {
  const service = new TicketService();

  it("counts tickets by the logged user id", async () => {
    const counts = {
      open: 1,
      inProgress: 0,
      resolved: 0,
      cancelled: 0,
      all: 1,
    };
    apiMock.get.mockResolvedValue({ data: counts });

    await expect(service.countTickets()).resolves.toEqual(counts);
    expect(apiMock.get).toHaveBeenCalledWith("/tickets/counts", {
      params: { userId: mockLoggedUser.id },
    });
  });

  it("counts tickets by the logged support id", async () => {
    setMockLoggedUser({
      ...mockLoggedUser,
      id: "s1",
      type: UserTypeEnum.SUPPORT,
    });
    apiMock.get.mockResolvedValue({
      data: { open: 2, inProgress: 1, resolved: 0, cancelled: 0, all: 3 },
    });

    await service.countTickets();

    expect(apiMock.get).toHaveBeenCalledWith("/tickets/counts", {
      params: { supportId: "s1" },
    });
  });

  it("lists a page with only the filters that were set", async () => {
    apiMock.get.mockResolvedValue({
      data: { items: [], totalPages: 0, total: 0 },
    });

    await service.listTickets({
      page: 2,
      pageSize: 5,
      query: " printer ",
      status: TicketStatusEnum.IN_PROGRESS,
      startDate: "2026-09-01",
    });

    expect(apiMock.get).toHaveBeenCalledWith("/tickets/list", {
      params: {
        page: 2,
        pageSize: 4,
        userId: mockLoggedUser.id,
        query: "printer",
        status: TicketStatusEnum.IN_PROGRESS,
        startDate: "2026-09-01",
      },
    });
  });
});
