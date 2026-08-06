import { UserTypeEnum } from "../enums/user-type.enum";

export interface LoggedUser {
  id: string;
  name: string;
  email: string;
  type: UserTypeEnum;
  avatar?: string | null;
}
