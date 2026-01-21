import { NAV_LINK } from "@web/libs/nav";
import { IUser } from "@web/libs/user";
import { RoleName } from "./role";

export const Teacher_ROLES = [
  RoleName.TEACHER_FULL_TIME,
  RoleName.TEACHER_PART_TIME,
];

export const OPS_ROLES = [
  RoleName.ADMIN,
  RoleName.MANAGE,
  RoleName.RECEPTIONIST,
  RoleName.STAFF_ACADEMIC,
  RoleName.STAFF_GENERAL,
];

export const canAccessTeacher = (user?: IUser): boolean => {
  if (!user) return false;
  return Teacher_ROLES.includes(user.role.roleName);
};

export const canAccessOPS = (user?: IUser): boolean => {
  if (!user) return false;
  return OPS_ROLES.includes(user.role.roleName);
};

export const canAccessStudent = (user?: IUser): boolean => {
  if (!user) return false;
  return user.role.roleName === RoleName.STUDENT;
};

export const getHomePathForUser = (user?: IUser): string => {
  if (!user) return NAV_LINK.LOGIN;

  if (canAccessOPS(user)) {
    return NAV_LINK.OPS;
  }

  if (canAccessTeacher(user)) {
    return NAV_LINK.TEACHER;
  }

  if (canAccessStudent(user)) {
    return NAV_LINK.STUDENT;
  }

  return NAV_LINK.LOGIN;
};
