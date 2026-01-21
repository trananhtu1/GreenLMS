import { ITimestamps } from "./common";

export interface IWeeklyNorm extends ITimestamps {
  id: string;
  startDate: Date;
  endDate: Date;
  quantity: number;
}
