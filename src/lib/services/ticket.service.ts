import { UserTypeEnum } from "../enums/user-type.enum";
import { api } from "../client/axios";
import { getLoggedUser } from "../helpers/get-logged-user";
import {
  TicketCounts,
  TicketListParams,
  TicketListResponse,
} from "../models/ticket";

interface AddTicketRequest {
  title: string;
  userId: string;
  description: string;
}

/** Service layer for the shared ticket home. */
export class TicketService {
  /**
   * Create a new ticket.
   * @param ticket - The ticket with title and description to create.
   * @returns Status.
   */
  public createTicket = async (
    ticket: Omit<AddTicketRequest, "userId">,
  ): Promise<string> => {
    const user = getLoggedUser();
    const addTicketRequest: AddTicketRequest = { ...ticket, userId: user.id };

    const response = await api.post<string>(
      "/tickets/create",
      addTicketRequest,
    );

    return response.data;
  };

  /**
   * Support accepts a user ticket.
   * @param ticketId Ticket's ID.
   * @returns Status.
   */
  public acceptTicket = async (ticketId: string): Promise<string> => {
    const user = getLoggedUser();

    const response = await api.post<string>("/tickets/accept", {
      ticketId,
      supportId: user.id,
    });

    return response.data;
  };

  /**
   * Card totals for the logged user.
   * Users and members are counted by userId. Support is counted by supportId.
   */
  public countTickets = async (): Promise<TicketCounts> => {
    const user = getLoggedUser();

    return (
      await api.get<TicketCounts>("/tickets/counts", {
        params: scopeParams(user.type, user.id),
      })
    ).data;
  };

  /**
   * One page of tickets for the logged user.
   * Called again when the page or the filters change.
   */
  public listTickets = async ({
    page,
    pageSize,
    query,
    status,
    startDate,
    endDate,
  }: TicketListParams): Promise<TicketListResponse> => {
    const user = getLoggedUser();

    const params: Record<string, string | number | undefined> = {
      page,
      pageSize,
      ...scopeParams(user.type, user.id),
    };

    if (query?.trim()) params.query = query.trim();
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return (await api.get<TicketListResponse>("/tickets/list", { params }))
      .data;
  };
}

function scopeParams(type: UserTypeEnum, id: string) {
  if (type === UserTypeEnum.SUPPORT) return { supportId: id };
  return { userId: id };
}
