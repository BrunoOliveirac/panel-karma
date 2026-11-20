import { useLoggedUserStore } from "../store/use-logged-user-store";
import { LoggedUser } from "../types/logged-user";

export function getLoggedUser(): LoggedUser {
  const user = useLoggedUserStore.getState().user;
  if (!user) throw new Error("Unauthenticated");

  return user;
}
