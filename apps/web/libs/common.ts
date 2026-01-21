import { MenuProps } from "antd";
import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import { FixedType } from "rc-table/lib/interface";
import { RoleName } from "./role";

dayjs.extend(updateLocale);
dayjs.updateLocale("en", {
  weekStart: 1,
});

// Format constants
export const DATE_FORMAT = "DD/MM/YYYY";
export const DATE_TIME_FORMAT = "DD/MM/YYYY HH:mm";
export const TIME_FORMAT = "HH:mm";
export const MAX_LIMIT_REQUEST = 100000;
export const HOURS_PER_SESSION = 2;

// Enums
export enum AccessRole {
  OPS = "OPS",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
}

// Types
export type MenuItem = Required<MenuProps>["items"][number];

export type Placement =
  | "topLeft"
  | "topCenter"
  | "topRight"
  | "bottomLeft"
  | "bottomCenter"
  | "bottomRight"
  | "top"
  | "bottom";

// Interfaces
export interface ITimestamps {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CustomResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}

export interface Pagination<T> {
  page: number;
  limit: number;
  total: number;
  items: T;
}

export interface NavigationItem {
  key?: React.Key;
  icon?: React.ReactNode;
  label: React.ReactNode;
  url?: string;
  children?: NavigationItem[];
  roles?: RoleName[];
}

export interface BreadcrumbItem {
  label: string;
  url: string;
}

export interface OtherColumn {
  index: string | number;
  method: React.ReactNode;
}

export interface TableColumn<T, O = OtherColumn> {
  title: React.ReactNode;
  dataIndex: keyof T | keyof O;
  key?: string | number;
  width?: number | string;
  render?: (
    value: T[keyof T] | O[keyof O],
    record?: T,
    index?: number,
  ) => React.ReactNode;
  fixed?: FixedType;
}

export const formatRangeDate = (startDate: string, endDate: string) => {
  return `${dayjs(startDate).format(DATE_FORMAT)} | ${dayjs(startDate).format(TIME_FORMAT)} - ${dayjs(endDate).format(TIME_FORMAT)}`;
};

/**
 * Calculate the approval deadline (3 days from creation date)
 */
export const calculateApprovalDeadline = (createdAt: string): string => {
  return dayjs(createdAt).add(3, "day").format(DATE_TIME_FORMAT);
};

/**
 * Check if request is past approval deadline
 */
export const isPastApprovalDeadline = (createdAt: string): boolean => {
  const deadlineDate = dayjs(createdAt).add(3, "day");
  return dayjs().isAfter(deadlineDate);
};
