import { IClass } from "./class";
import { ITimestamps } from "./common";
import { IUser } from "./user";

export enum RequestType {
  WEEKLY_NORM = "WEEKLY_NORM",
  TIME_OFF = "TIME_OFF",
  BUSY_SCHEDULE = "BUSY_SCHEDULE",
  SUPPORT_TICKET = "SUPPORT_TICKET", // Add support ticket type
}

export enum RequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELED = "CANCELED",
}

export enum RequestPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface WeeklyNormDto {
  id?: string;
  startDate: Date;
  endDate: Date;
  quantity: number;
  teacherId?: string;
}

export interface ISchedule {
  startDate: string;
  endDate: string;
}

export interface IRequest extends ITimestamps {
  id: string;
  name: string;
  description: string;
  type: RequestType;
  status?: RequestStatus;
  creatorId: string;
  creator: IUser;
  requesterId?: string;
  requester?: IUser;
  approverId?: string;
  approver?: IUser;
  teacherId?: string;
  weeklyNorms?: WeeklyNormDto[];
  schedules?: ISchedule[];
  supportTicket?: ISupportTicket;
}

export interface ISupportTicket {
  id: string;
  class: IClass;
  request: IRequest;
  priority: RequestPriority;
}

export interface CreateRequestWeeklyNormDto {
  name: string;
  description: string;
  status?: RequestStatus;
  teacherId?: string;
  requesterId?: string;
  approverId?: string;
  weeklyNorms?: WeeklyNormDto[];
}

export interface TimeOffScheduleDto {
  startDate: Date;
  endDate: Date;
}

export interface CreateRequestTimeOffDto {
  name: string;
  description?: string;
  schedules: TimeOffScheduleDto[];
}

export interface CreateRequestBusyScheduleDto {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
}

export interface CreateRequestSupportTicketDto {
  name: string;
  description?: string;
  classId: string;
  priority: RequestPriority;
  teacherId?: string;
}

export const RequestStatusOptions = [
  {
    value: RequestStatus.PENDING,
    label: "Pending",
  },
  {
    value: RequestStatus.APPROVED,
    label: "Approved",
  },
  {
    value: RequestStatus.REJECTED,
    label: "Rejected",
  },
  {
    value: RequestStatus.CANCELED,
    label: "Canceled",
  },
];

export const RequestPriorityOptions = [
  {
    value: RequestPriority.LOW,
    label: "Low",
  },
  {
    value: RequestPriority.MEDIUM,
    label: "Medium",
  },
  {
    value: RequestPriority.HIGH,
    label: "High",
  },
  {
    value: RequestPriority.URGENT,
    label: "Urgent",
  },
];

export enum RequestAction {
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  CANCEL = "CANCEL",
}

export const REQUEST_STATUS_TAG = {
  [RequestStatus.PENDING]: "warning",
  [RequestStatus.APPROVED]: "success",
  [RequestStatus.REJECTED]: "error",
  [RequestStatus.CANCELED]: "default",
} as const;

export const REQUEST_PRIORITY_TAG = {
  [RequestPriority.LOW]: "success",
  [RequestPriority.MEDIUM]: "processing",
  [RequestPriority.HIGH]: "warning",
  [RequestPriority.URGENT]: "error",
} as const;
