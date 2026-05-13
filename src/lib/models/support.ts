import { UserTypeEnum } from "../enums/user-type.enum";
import { BaseModel } from "./base-model";

export interface Support extends BaseModel {
  name: string;
  email: string;
  avatar?: string;
  type: UserTypeEnum;
}
