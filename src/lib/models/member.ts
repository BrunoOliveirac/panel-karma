import { UserTypeEnum } from "../enums/user-type.enum";
import { BaseModel } from "./base-model";

export interface Member extends BaseModel {
  name: string;
  email: string;
  avatar?: string;
  type: UserTypeEnum;
}
