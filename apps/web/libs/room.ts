import { ITimestamps } from "./common";
import { UserStatus } from "./user";

export interface IRoom extends ITimestamps {
  id: string;
  code: string;
  name: string;
  quantity: number;
  location: string;
  description: string;
  status: UserStatus;
}

export interface CreateRoomDto {
  code?: string;
  name?: string;
  quantity?: number;
  location?: string;
  description?: string;
  status?: UserStatus;
}
