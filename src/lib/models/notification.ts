import type { BaseModel } from "./base-model";
import type { User } from "./user";

export interface Notification extends BaseModel {
  user: User;
  code: string;
  type: string;
  actor?: User;
  read: boolean;
  deletedAt?: Date;
  referenceId?: string;
  referenceLabel?: string;
}

export interface LatestNotificationsResponse {
  notifications: Notification[];
  hasUnreadNotifications: boolean;
}

export type NotificationStatus = "all" | "unread" | "read";

export interface NotificationCounts {
  all: number;
  unread: number;
  read: number;
}

export interface NotificationListParams {
  page: number;
  query: string;
  status: NotificationStatus;
}

export interface NotificationListResponse {
  notifications: Notification[];
  hasMore: boolean;
  counts: NotificationCounts;
}
