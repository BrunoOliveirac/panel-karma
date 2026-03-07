import { UserTypeEnum } from "@enums/UserTypeEnum";
import type { BaseModel } from "./base-model";

export interface User extends BaseModel {
  name: string;
  email: string;
  avatar?: string;
  type: UserTypeEnum;
}
