import { TicketStatusEnum } from "../enums/ticket-status.enum";
import type { BaseModel } from "./base-model";

export interface Ticket extends BaseModel {
  title: string;
  description: string;
  status: TicketStatusEnum;
  userId: string;
  userName?: string | null;
  userAvatar?: string | null;
  supportId?: string | null;
  supportName?: string | null;
  supportAvatar?: string | null;
  code?: number | null;
  acceptedAt?: string | null;
  finishedAt?: string | null;
}

export interface TicketCounts {
  open: number;
  inProgress: number;
  resolved: number;
  cancelled: number;
  all: number;
}

export type TicketPageSize = 5;

export interface TicketListParams {
  page: number;
  pageSize: TicketPageSize;
  query?: string;
  status?: TicketStatusEnum | null;
  startDate?: string;
  endDate?: string;
  timeZone?: string;
}

export interface TicketListResponse {
  items: Ticket[];
  totalPages: number;
  total: number;
}

export interface TicketStreamEvent {
  ticket: Ticket;
  previousStatus: TicketStatusEnum | null;
}
