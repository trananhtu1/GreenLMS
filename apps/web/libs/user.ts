import { RoleName } from "@web/libs/role";
import { ITimestamps } from "./common";
import { IDepartment } from "./department";
import { IField } from "./field";

export interface IUser extends ITimestamps {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string;
  role: IRole;
  detail: IDetailUser;
  status: UserStatus;
  lastLogin?: Date;
  avatar?: string;
}

export interface CreateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phoneNumber?: string;
  roleName?: RoleName;
  departmentId?: string;
  fieldId?: string;
  teacherLevel?: TeacherLevel;
}

export interface IRole {
  id: string;
  roleName: RoleName;
}

export interface IDetailUser {
  code: string;
  teacherLevel: TeacherLevel;
  field?: IField;
  department?: IDepartment;
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  BLOCKED = "BLOCKED",
}

export const STATUS_TAG = {
  [UserStatus.ACTIVE]: "green",
  [UserStatus.BLOCKED]: "red",
} as const;

export const STATUS_LABEL = {
  [UserStatus.ACTIVE]: "Active",
  [UserStatus.BLOCKED]: "Blocked",
} as const;

export const StatusOptions = [
  {
    label: STATUS_LABEL[UserStatus.ACTIVE],
    value: UserStatus.ACTIVE,
  },
  {
    label: STATUS_LABEL[UserStatus.BLOCKED],
    value: UserStatus.BLOCKED,
  },
];

// Enum for teacher levels
export enum TeacherLevel {
  A1 = "A1",
  A2 = "A2",
  B1 = "B1",
  B2 = "B2",
  C1 = "C1",
  C2 = "C2",
}

// Options for teacher level select
export const TeacherLevelOptions = [
  { label: TeacherLevel.A1, value: TeacherLevel.A1 },
  { label: TeacherLevel.A2, value: TeacherLevel.A2 },
  { label: TeacherLevel.B1, value: TeacherLevel.B1 },
  { label: TeacherLevel.B2, value: TeacherLevel.B2 },
  { label: TeacherLevel.C1, value: TeacherLevel.C1 },
  { label: TeacherLevel.C2, value: TeacherLevel.C2 },
];
