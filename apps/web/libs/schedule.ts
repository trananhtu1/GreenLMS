import { IClass } from "./class";
import { ITimestamps } from "./common";
import { IRoom } from "./room";
import { UserStatus } from "./user";

export enum ScheduleType {
  BUSY = "BUSY",
  TEACHING = "TEACHING",
}

export interface ISchedule extends ITimestamps {
  id: string;
  name: string;
  description: string;
  type: ScheduleType;
  startDate: string;
  endDate: string;
  status: UserStatus;
  requestId: string;
  teacherId: string;
  classId?: string;
  class?: IClass;
  roomId?: string;
  room?: IRoom;
}

export const SCHEDULE_TYPE_LABEL = {
  [ScheduleType.BUSY]: "Lịch bận",
  [ScheduleType.TEACHING]: "Lịch dạy",
} as const;

export const SCHEDULE_TYPE_TAG = {
  [ScheduleType.BUSY]: "error",
  [ScheduleType.TEACHING]: "success",
} as const;

export const SCHEDULE_TYPE_OPTIONS = [
  {
    value: ScheduleType.BUSY,
    label: SCHEDULE_TYPE_LABEL[ScheduleType.BUSY],
  },
  {
    value: ScheduleType.TEACHING,
    label: SCHEDULE_TYPE_LABEL[ScheduleType.TEACHING],
  },
];

export interface CreateTeachingScheduleDto {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
}

export interface CreateTeachingSchedulesDto {
  classId: string;
  schedules: CreateTeachingScheduleDto[];
}

export interface UpdateSchedulePayload {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  type?: string;
}

export const WEEKDAY_OPTIONS = [
  { label: "Thứ hai", value: 1 },
  { label: "Thứ ba", value: 2 },
  { label: "Thứ tư", value: 3 },
  { label: "Thứ năm", value: 4 },
  { label: "Thứ sáu", value: 5 },
  { label: "Thứ bảy", value: 6 },
  { label: "Chủ nhật", value: 7 },
];
