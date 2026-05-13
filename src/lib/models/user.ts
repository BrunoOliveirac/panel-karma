import { UserTypeEnum } from "../enums/user-type.enum";
import type { BaseModel } from "./base-model";

export interface User extends BaseModel {
  name: string;
  email: string;
  avatar?: string;
  type: UserTypeEnum;
}
