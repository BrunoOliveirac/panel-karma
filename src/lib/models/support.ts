import type { UserTypeEnum } from "@enums/UserTypeEnum";
import { BaseModel } from "./base-model";

export interface Support extends BaseModel {
  name: string;
  email: string;
  avatar?: string;
  type: UserTypeEnum;
}
