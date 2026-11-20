import { UserTypeEnum } from "../enums/user-type.enum";
import { useLoggedUserStore } from "../store/use-logged-user-store";
import { LoggedUser } from "../types/logged-user";

/** Default logged user used by Jest instead of the old `user` cookie. */
export const mockLoggedUser: LoggedUser = {
  id: "01",
  name: "Test User",
  email: "user01@email.com",
  type: UserTypeEnum.USER,
};

export function setMockLoggedUser(user: LoggedUser = mockLoggedUser) {
  useLoggedUserStore.getState().setUser(user);
}

export function clearMockLoggedUser() {
  useLoggedUserStore.getState().setUser(null);
}
