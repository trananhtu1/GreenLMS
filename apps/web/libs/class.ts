import { ITimestamps } from "./common";
import { ICourse } from "./course";
import { IRoom } from "./room";
import { IStudentClass } from "./student-class";
import { IUser, UserStatus } from "./user";

export interface IClass extends ITimestamps {
  id: string;
  code: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  quantity: number;
  status: UserStatus;
  courseId: string;
  teacherId: string;
  roomId: string;
  course?: ICourse;
  teacher?: IUser;
  room?: IRoom;
  studentClasses?: IStudentClass[];
}

export interface CreateClassDto {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  quantity?: number;
  status?: UserStatus;
  courseId: string;
  teacherId?: string;
  roomId?: string;
}

export interface UpdateClassDto {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  quantity?: number;
  status?: UserStatus;
  teacherId?: string;
  roomId?: string;
}

export interface QueryClassDto {
  name?: string;
  courseId?: string;
  teacherId?: string;
  status?: UserStatus;
  page?: number;
  limit?: number;
}

export enum Shift {
  MORNING_1 = "MORNING_1",
  MORNING_2 = "MORNING_2",
  AFTERNOON_1 = "AFTERNOON_1",
  AFTERNOON_2 = "AFTERNOON_2",
  EVENING = "EVENING",
}

export interface ShiftOption {
  label: string;
  value: Shift;
  startTime: string;
  endTime: string;
}

export const SHIFTS_OPTIONS: ShiftOption[] = [
  {
    label: "Ca sáng 1 (07:30 - 09:30)",
    value: Shift.MORNING_1,
    startTime: "07:30",
    endTime: "09:30",
  },
  {
    label: "Ca sáng 2 (09:45 - 11:45)",
    value: Shift.MORNING_2,
    startTime: "09:45",
    endTime: "11:45",
  },
  {
    label: "Ca chiều 1 (13:30 - 15:30)",
    value: Shift.AFTERNOON_1,
    startTime: "13:30",
    endTime: "15:30",
  },
  {
    label: "Ca chiều 2 (15:45 - 17:45)",
    value: Shift.AFTERNOON_2,
    startTime: "15:45",
    endTime: "17:45",
  },
  {
    label: "Ca tối (18:30 - 20:30)",
    value: Shift.EVENING,
    startTime: "18:30",
    endTime: "20:30",
  },
];
