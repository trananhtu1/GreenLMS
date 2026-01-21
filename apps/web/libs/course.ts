import { ITimestamps } from "./common";
import { UserStatus } from "./user";

export enum CourseType {
  TOEIC = "TOEIC",
  TOEFL = "TOEFL",
  IELTS = "IELTS",
}

export interface ICourse extends ITimestamps {
  id: string;
  code: string;
  name: string;
  description: string;
  status: UserStatus;
  type: CourseType;
  hours?: number;
}

export interface CreateCourseDto {
  code?: string;
  name?: string;
  description?: string;
  status?: UserStatus;
  type?: CourseType;
  hours?: number;
}
