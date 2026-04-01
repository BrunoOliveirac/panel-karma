import type { BaseModel } from "./base-model";

export interface Client extends BaseModel {
  name: string;
  email: string;
  phone: string;
  notes: string;
  userId: string;
  budget: number;
  favorite: boolean;
}
