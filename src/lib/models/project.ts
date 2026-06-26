import type { BaseModel } from "./base-model";
import { Client } from "./client";

export interface Project extends BaseModel {
  name: string;
  userId: string;
  client: Client;
}
