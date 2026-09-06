import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import { apiMock } from "@/lib/mocks/api.mock";
import { ProfileService } from "./profile.service";

const persistTokenMock = jest.fn();

jest.mock("@/lib/client/axios", () => ({
  api: require("@/lib/mocks/api.mock").apiMock,
}));

jest.mock("./auth.service", () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    persistToken: persistTokenMock,
  })),
}));

describe("ProfileService", () => {
  const service = new ProfileService();
  const user = {
    id: "01",
    name: "Test User",
    email: "user@email.com",
    type: UserTypeEnum.USER,
  };

  it("loads the current profile", async () => {
    apiMock.get.mockResolvedValue({ data: user });
    await expect(service.getProfile()).resolves.toEqual(user);
    expect(apiMock.get).toHaveBeenCalledWith("/profile");
  });

  it("updates the profile without rotating the token", async () => {
    apiMock.put.mockResolvedValue({ data: { ...user, token: null } });

    await expect(
      service.updateProfile({ name: "Test User", email: "user@email.com" }),
    ).resolves.toEqual(user);

    expect(persistTokenMock).not.toHaveBeenCalled();
  });

  it("persists a fresh token when the API rotates the session", async () => {
    apiMock.put.mockResolvedValue({
      data: { ...user, token: "new-jwt" },
    });

    await expect(
      service.updateProfile({
        name: "Test User",
        email: "new@email.com",
        password: "Password1!",
      }),
    ).resolves.toEqual(user);

    expect(persistTokenMock).toHaveBeenCalledWith("new-jwt");
  });
});
