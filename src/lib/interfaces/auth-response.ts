import { LoggedUser } from "../types/logged-user";

export interface AuthResponse {
  token: string;
  user: LoggedUser;
  expirationDate: string;
}
