import { api } from "../client/axios";
import { getLoggedUser } from "../helpers/get-logged-user";
import { Notification } from "../models/notification";

/** Service layer for listing the logged-in user's notifications. */
export class NotificationService {
  /**
   * Get the latest notifications for the current user.
   * @returns An array of notifications.
   */
  public getLatestNotifications = async (): Promise<Notification[]> => {
    const user = getLoggedUser();

    const notifications = (
      await api.get<Notification[]>(`/notifications/latest/${user.id}`)
    ).data;

    return notifications;
  };
}
