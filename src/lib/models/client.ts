import type { BaseModel } from "./base-model";
import { Sector } from "./sector";

export interface Client extends BaseModel {
  name: string;
  email: string;
  phone: string;
  notes: string;
  userId: string;
  budget: number;
  sector: Sector;
  favorite: boolean;
}
