import { TicketStatusEnum } from "@/lib/enums/ticket-status.enum";
import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import { Ticket } from "@/lib/models/ticket";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Swal from "sweetalert2";
import TicketCardActions from "./ticket-card-actions";

const acceptTicket = jest.fn();
const resolveTicket = jest.fn();
const cancelTicket = jest.fn();

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("sweetalert2", () => ({
  __esModule: true,
  default: { fire: jest.fn() },
}));

jest.mock("next/navigation", () => {
  const push = jest.fn();
  return { useRouter: () => ({ push }) };
});

jest.mock("@/lib/services/ticket.service", () => ({
  TicketService: jest.fn().mockImplementation(() => ({
    acceptTicket: (...args: unknown[]) => acceptTicket(...args),
    resolveTicket: (...args: unknown[]) => resolveTicket(...args),
    cancelTicket: (...args: unknown[]) => cancelTicket(...args),
  })),
}));

function ticket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: "t1",
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    title: "Printer",
    description: "Paper jam",
    status: TicketStatusEnum.OPEN,
    userId: "u1",
    supportId: null,
    ...overrides,
  };
}

describe("TicketCardActions", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    acceptTicket.mockResolvedValue("ok");
    resolveTicket.mockResolvedValue("ok");
    cancelTicket.mockResolvedValue("ok");
    (Swal.fire as jest.Mock).mockResolvedValue({ isConfirmed: true });
  });

  it("accepts an open ticket from the support menu", async () => {
    render(
      <TicketCardActions ticket={ticket()} viewerType={UserTypeEnum.SUPPORT} />,
    );

    expect(
      screen.queryByTestId("ticket-action-accept"),
    ).not.toBeInTheDocument();
    await user.click(screen.getByTestId("ticket-actions"));
    await user.click(screen.getByTestId("ticket-action-accept"));

    expect(acceptTicket).toHaveBeenCalledWith("t1");
    expect(Swal.fire).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("ticket_accepted");
  });

  it("confirms resolve from the support menu and then calls the service", async () => {
    render(
      <TicketCardActions
        viewerType={UserTypeEnum.SUPPORT}
        ticket={ticket({
          status: TicketStatusEnum.IN_PROGRESS,
          supportId: "s1",
        })}
      />,
    );

    expect(
      screen.queryByTestId("ticket-action-open-chat"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByTestId("ticket-actions"));
    expect(screen.getByTestId("ticket-action-open-chat")).toHaveTextContent(
      "open_chat",
    );
    await user.click(screen.getByTestId("ticket-action-resolve"));

    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "resolve_title",
        text: "resolve_description",
      }),
    );
    expect(resolveTicket).toHaveBeenCalledWith("t1");
    expect(toast.success).toHaveBeenCalledWith("ticket_resolved");
  });

  it("lets the owner cancel an open ticket only after confirmation", async () => {
    render(
      <TicketCardActions ticket={ticket()} viewerType={UserTypeEnum.USER} />,
    );

    expect(
      screen.queryByTestId("ticket-action-open-chat"),
    ).not.toBeInTheDocument();
    await user.click(screen.getByTestId("ticket-actions"));
    expect(
      screen.queryByTestId("ticket-action-resolve"),
    ).not.toBeInTheDocument();
    await user.click(screen.getByTestId("ticket-action-cancel"));

    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ title: "cancel_title" }),
    );
    expect(cancelTicket).toHaveBeenCalledWith("t1");
  });

  it("opens the linked chat without confirming", async () => {
    render(
      <TicketCardActions
        viewerType={UserTypeEnum.USER}
        ticket={ticket({
          status: TicketStatusEnum.RESOLVED,
          supportId: "s1",
        })}
      />,
    );

    await user.click(screen.getByTestId("ticket-actions"));
    await user.click(screen.getByTestId("ticket-action-open-chat"));

    expect(useRouter().push).toHaveBeenCalledWith("/chat?ticketId=t1");
    expect(resolveTicket).not.toHaveBeenCalled();
  });

  it("skips the transition when the alert is dismissed", async () => {
    (Swal.fire as jest.Mock).mockResolvedValue({ isConfirmed: false });

    render(
      <TicketCardActions ticket={ticket()} viewerType={UserTypeEnum.USER} />,
    );

    await user.click(screen.getByTestId("ticket-actions"));
    await user.click(screen.getByTestId("ticket-action-cancel"));

    expect(cancelTicket).not.toHaveBeenCalled();
  });

  it("shows an error toast when the confirmed transition fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    cancelTicket.mockRejectedValue(new Error("nope"));

    render(
      <TicketCardActions
        viewerType={UserTypeEnum.SUPPORT}
        ticket={ticket({
          status: TicketStatusEnum.IN_PROGRESS,
          supportId: "s1",
        })}
      />,
    );

    await user.click(screen.getByTestId("ticket-actions"));
    await user.click(screen.getByTestId("ticket-action-cancel"));

    expect(toast.error).toHaveBeenCalledWith("could_not_cancel");
  });
});
