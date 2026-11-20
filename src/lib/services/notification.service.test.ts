import { mockLoggedUser } from "@/lib/mocks/logged-user.mock";
import { apiMock } from "@/lib/mocks/api.mock";
import { NotificationService } from "./notification.service";

jest.mock("@/lib/client/axios", () => ({
  api: require("@/lib/mocks/api.mock").apiMock,
}));

describe("NotificationService", () => {
  const service = new NotificationService();

  it("loads the latest notifications for the logged user", async () => {
    apiMock.get.mockResolvedValue({
      data: { notifications: [], hasUnreadNotifications: false },
    });

    await service.getLatestNotifications();
    expect(apiMock.get).toHaveBeenCalledWith(
      `/notifications/latest/${mockLoggedUser.id}`,
    );
  });

  it("loads a paginated notification list", async () => {
    apiMock.get.mockResolvedValue({
      data: { notifications: [], hasMore: false, counts: {} },
    });

    await service.getNotifications({
      page: 2,
      query: "project",
      status: "unread",
    });

    expect(apiMock.get).toHaveBeenCalledWith(
      `/notifications/list/${mockLoggedUser.id}`,
      { params: { page: 2, query: "project", status: "unread" } },
    );
  });

  it("marks one notification, all notifications, and deletes one", async () => {
    apiMock.patch.mockResolvedValue({});
    apiMock.delete.mockResolvedValue({});

    await service.markNotificationAsRead("n1");
    await service.markAllNotificationsAsRead();
    await service.deleteNotification("n1");

    expect(apiMock.patch).toHaveBeenCalledWith(
      "/notifications/mark-as-read/n1",
    );
    expect(apiMock.patch).toHaveBeenCalledWith(
      `/notifications/mark-all-as-read/${mockLoggedUser.id}`,
    );
    expect(apiMock.delete).toHaveBeenCalledWith("/notifications/n1");
  });
});
