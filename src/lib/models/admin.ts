import { UserTypeEnum } from "../enums/user-type.enum";
import type { BaseModel } from "./base-model";

export interface Admin extends BaseModel {
  name: string;
  email: string;
  type: UserTypeEnum;
  avatar?: undefined;
}
