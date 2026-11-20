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

  it("creates a ticket for the logged user", async () => {
    apiMock.post.mockResolvedValue({ data: "t1" });

    await expect(
      service.createTicket({ title: "Printer", description: "Paper jam" }),
    ).resolves.toBe("t1");

    expect(apiMock.post).toHaveBeenCalledWith("/tickets/create", {
      title: "Printer",
      description: "Paper jam",
      userId: mockLoggedUser.id,
    });
  });

  it("accepts a ticket as the logged support", async () => {
    setMockLoggedUser({
      ...mockLoggedUser,
      id: "s1",
      type: UserTypeEnum.SUPPORT,
    });
    apiMock.post.mockResolvedValue({ data: "ok" });

    await expect(service.acceptTicket("t1")).resolves.toBe("ok");
    expect(apiMock.post).toHaveBeenCalledWith("/tickets/accept", {
      ticketId: "t1",
      supportId: "s1",
    });
  });

  it("resolves and cancels a ticket by id", async () => {
    apiMock.post.mockResolvedValue({ data: "ok" });

    await expect(service.resolveTicket("t1")).resolves.toBe("ok");
    await expect(service.cancelTicket("t9")).resolves.toBe("ok");

    expect(apiMock.post).toHaveBeenCalledWith("/tickets/resolve/t1");
    expect(apiMock.post).toHaveBeenCalledWith("/tickets/cancel/t9");
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
      timeZone: "America/Sao_Paulo",
    });

    expect(apiMock.get).toHaveBeenCalledWith("/tickets/list", {
      params: {
        page: 2,
        pageSize: 5,
        userId: mockLoggedUser.id,
        query: "printer",
        status: TicketStatusEnum.IN_PROGRESS,
        startDate: "2026-09-01",
        timeZone: "America/Sao_Paulo",
      },
    });

    await service.listTickets({
      page: 1,
      pageSize: 5,
      query: "   ",
      status: null,
    });

    expect(apiMock.get).toHaveBeenCalledWith("/tickets/list", {
      params: { page: 1, pageSize: 5, userId: mockLoggedUser.id },
    });

    setMockLoggedUser({
      ...mockLoggedUser,
      id: "s1",
      type: UserTypeEnum.SUPPORT,
    });

    await service.listTickets({ page: 1, pageSize: 5 });

    expect(apiMock.get).toHaveBeenCalledWith("/tickets/list", {
      params: { page: 1, pageSize: 5, supportId: "s1" },
    });
  });
});
