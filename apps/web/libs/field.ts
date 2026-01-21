import { ITimestamps } from "./common";
import { IUser } from "./user";

export interface IField extends ITimestamps {
  id: string;
  code: string;
  name: string;
  description: string;
  leaderId: string | null;
  leader: IUser | null;
}

export interface CreateFieldDto {
  code?: string;
  name?: string;
  description?: string;
  leaderId?: string;
}
