import { TicketStatusEnum } from "../enums/ticket-status.enum";
import { UserTypeEnum } from "../enums/user-type.enum";
import {
  ticketActionNeedsConfirm,
  ticketCardActions,
  ticketChatPath,
  ticketHasChat,
} from "./ticket-actions";

describe("ticketCardActions", () => {
  it("offers accept to support on an open ticket and nothing else", () => {
    expect(
      ticketCardActions(UserTypeEnum.SUPPORT, {
        status: TicketStatusEnum.OPEN,
      }),
    ).toEqual({ primary: "accept", menu: [] });
  });

  it("lets support open the chat and resolve or cancel while it is in progress", () => {
    expect(
      ticketCardActions(UserTypeEnum.SUPPORT, {
        status: TicketStatusEnum.IN_PROGRESS,
        supportId: "s1",
      }),
    ).toEqual({
      primary: null,
      menu: ["open_chat", "resolve", "cancel"],
    });
  });

  it("keeps only the chat on a closed support ticket", () => {
    expect(
      ticketCardActions(UserTypeEnum.SUPPORT, {
        status: TicketStatusEnum.RESOLVED,
        supportId: "s1",
      }),
    ).toEqual({ primary: null, menu: ["open_chat"] });

    expect(
      ticketCardActions(UserTypeEnum.SUPPORT, {
        status: TicketStatusEnum.CANCELLED,
        acceptedAt: "2026-01-02T00:00:00.000Z",
      }),
    ).toEqual({ primary: null, menu: ["open_chat"] });
  });

  it("lets the owner cancel an open ticket without a chat", () => {
    for (const role of [UserTypeEnum.USER, UserTypeEnum.MEMBER]) {
      expect(
        ticketCardActions(role, { status: TicketStatusEnum.OPEN }),
      ).toEqual({ primary: null, menu: ["cancel"] });
    }
  });

  it("lets the owner open the chat and cancel while it is in progress", () => {
    expect(
      ticketCardActions(UserTypeEnum.MEMBER, {
        status: TicketStatusEnum.IN_PROGRESS,
        supportId: "s1",
      }),
    ).toEqual({ primary: null, menu: ["open_chat", "cancel"] });
  });

  it("opens the chat for a closed owner ticket that was actually attended", () => {
    expect(
      ticketCardActions(UserTypeEnum.USER, {
        status: TicketStatusEnum.RESOLVED,
        supportId: "s1",
      }),
    ).toEqual({ primary: null, menu: ["open_chat"] });

    expect(
      ticketCardActions(UserTypeEnum.USER, {
        status: TicketStatusEnum.CANCELLED,
      }),
    ).toEqual({ primary: null, menu: [] });
  });

  it("hides every action from roles that do not own the home queue", () => {
    expect(
      ticketCardActions(UserTypeEnum.ADMIN, {
        status: TicketStatusEnum.OPEN,
      }),
    ).toEqual({ primary: null, menu: [] });
  });
});

describe("ticketHasChat", () => {
  it("hides the chat until the ticket leaves the open queue", () => {
    expect(ticketHasChat({ status: TicketStatusEnum.OPEN })).toBe(false);
    expect(
      ticketHasChat({
        status: TicketStatusEnum.CANCELLED,
        supportId: null,
        acceptedAt: null,
      }),
    ).toBe(false);
    expect(
      ticketHasChat({
        status: TicketStatusEnum.CANCELLED,
        supportId: "s1",
      }),
    ).toBe(true);
    expect(ticketHasChat({ status: TicketStatusEnum.IN_PROGRESS })).toBe(true);
  });
});

describe("ticket transitions", () => {
  it("confirms only resolve and cancel", () => {
    expect(ticketActionNeedsConfirm("accept")).toBe(false);
    expect(ticketActionNeedsConfirm("open_chat")).toBe(false);
    expect(ticketActionNeedsConfirm("resolve")).toBe(true);
    expect(ticketActionNeedsConfirm("cancel")).toBe(true);
  });

  it("builds the chat route from the ticket id", () => {
    expect(ticketChatPath("t1")).toBe("/chat?ticketId=t1");
    expect(ticketChatPath("a/b")).toBe("/chat?ticketId=a%2Fb");
  });
});
