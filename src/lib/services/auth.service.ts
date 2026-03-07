import { api } from "../client/axios";
import { AuthResponse } from "../interfaces/auth-response";

interface LoginParams {
  email: string;
  password: string;
}

interface RegisterParams extends LoginParams {
  name: string;
}

export class AuthService {
  public login = async (loginParams: LoginParams): Promise<void> => {
    const authResponse = (
      await api.post<AuthResponse>("/auth/login", loginParams)
    ).data;

    await this.saveData(authResponse);
  };

  public register = async (registerParams: RegisterParams): Promise<void> => {
    const authResponse = (
      await api.post<AuthResponse>("/auth/register", registerParams)
    ).data;

    await this.saveData(authResponse);
  };

  private saveData = async (authResponse: AuthResponse) => {
    return fetch("/api/login", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(authResponse),
    });
  };
}
