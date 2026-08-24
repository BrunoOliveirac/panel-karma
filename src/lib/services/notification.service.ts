import { api } from "../client/axios";
import { getLoggedUser } from "../helpers/get-logged-user";
import { LatestNotificationsResponse } from "../models/notification";

/** Service layer for listing the logged-in user's notifications. */
export class NotificationService {
  /**
   * Get the latest notifications for the current user.
   * @returns An array of notifications.
   */
  public getLatestNotifications =
    async (): Promise<LatestNotificationsResponse> => {
      const user = getLoggedUser();

      const notifications = (
        await api.get<LatestNotificationsResponse>(
          `/notifications/latest/${user.id}`,
        )
      ).data;

      return notifications;
    };

  /**
   * Mark a notification as read.
   * @param notificationId - The ID of the notification to mark as read.
   * @returns void
   */
  public markNotificationAsRead = async (
    notificationId: string,
  ): Promise<void> => {
    await api.patch<void>(`/notifications/mark-as-read/${notificationId}`);
  };

  /**
   * Mark all notifications as read.
   * @returns void
   */
  public markAllNotificationsAsRead = async (): Promise<void> => {
    const user = getLoggedUser();

    await api.patch<void>(`/notifications/mark-all-as-read/${user.id}`);
  };

  /**
   * Delete a notification.
   * @param notificationId - The ID of the notification to delete.
   * @returns void
   */
  public deleteNotification = async (notificationId: string): Promise<void> => {
    await api.delete<void>(`/notifications/${notificationId}`);
  };
}
