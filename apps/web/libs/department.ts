import { ITimestamps } from "./common";

export interface IDepartment extends ITimestamps {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface CreateDepartmentDto {
  code?: string;
  name: string;
  description?: string;
}
