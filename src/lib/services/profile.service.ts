import { api } from "../client/axios";
import { LoggedUser } from "../types/logged-user";
import { AuthService } from "./auth.service";

export interface UpdateProfileParams {
  name: string;
  email: string;
  password?: string;
  avatar?: string | null;
}

interface UpdateProfileResponse extends LoggedUser {
  token?: string | null;
}

export class ProfileService {
  private readonly authService = new AuthService();

  /**
   * Get the logged-in user details.
   * @returns The logged-in user.
   */
  public getProfile = async (): Promise<LoggedUser> => {
    return (await api.get<LoggedUser>("/profile")).data;
  };

  /**
   * Update the logged-in user's own profile (name, email, avatar, optional password).
   * When the API returns a fresh token (e-mail/password change), the session cookie is replaced.
   * @param params Profile fields to persist.
   * @returns The updated logged-in user.
   */
  public updateProfile = async (
    params: UpdateProfileParams,
  ): Promise<LoggedUser> => {
    const { token, ...user } = (
      await api.put<UpdateProfileResponse>("/profile", params)
    ).data;

    if (token) await this.authService.persistToken(token);

    return user;
  };
}
