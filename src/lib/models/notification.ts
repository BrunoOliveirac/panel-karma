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
