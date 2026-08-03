import { api } from "../client/axios";
import { LoggedUser } from "../types/logged-user";

export class ProfileService {
  /**
   * Get the logged-in user details.
   * @returns The logged-in user.
   */
  public getProfile = async (): Promise<LoggedUser> => {
    return (await api.get<LoggedUser>("/profile")).data;
  };
}
