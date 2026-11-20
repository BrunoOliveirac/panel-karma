import type { BaseModel } from "./base-model";
import { Sector } from "./sector";

export interface Client extends BaseModel {
  name: string;
  email: string;
  phone: string;
  notes: string;
  cover?: string;
  userId: string;
  budget: number;
  sector: Sector;
  avatar?: string;
  favorite: boolean;
}
