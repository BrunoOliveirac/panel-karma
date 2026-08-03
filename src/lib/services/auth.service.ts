import { api } from "../client/axios";

interface LoginParams {
  email: string;
  password: string;
}

interface RegisterParams extends LoginParams {
  name: string;
}

export class AuthService {
  public login = async (loginParams: LoginParams): Promise<void> => {
    const authResponse = (await api.post<string>("/auth/login", loginParams))
      .data;

    await this.saveData(authResponse);
  };

  public register = async (registerParams: RegisterParams): Promise<void> => {
    const authResponse = (
      await api.post<string>("/auth/register", registerParams)
    ).data;

    await this.saveData(authResponse);
  };

  private saveData = async (token: string) => {
    return fetch("/api/login", {
      method: "POST",
      credentials: "include",
      body: token,
    });
  };
}
