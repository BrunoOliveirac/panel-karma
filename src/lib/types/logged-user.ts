import { Admin } from "../models/admin";
import { Support } from "../models/support";
import { User } from "../models/user";

export type LoggedUser = User | Support | Admin;
