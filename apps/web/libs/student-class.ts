import { IClass } from "./class";
import { ITimestamps } from "./common";
import { IUser, UserStatus } from "./user";

export interface IStudentClass extends ITimestamps {
  id: string;
  studentId: string;
  classId: string;
  status: UserStatus;
  student?: IUser;
  class?: IClass;
}

export interface QueryStudentClassDto {
  studentId?: string;
  classId?: string;
  status?: UserStatus;
  page?: number;
  limit?: number;
  search?: string;
}

export interface AddStudentToClassDto {
  studentId: string;
  classId: string;
}

export interface UpdateStudentClassStatusDto {
  status: UserStatus;
}
