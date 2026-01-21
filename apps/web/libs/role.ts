export enum RoleName {
  ADMIN = "ADMIN",
  MANAGE = "MANAGE",
  STAFF_ACADEMIC = "STAFF_ACADEMIC",
  STAFF_GENERAL = "STAFF_GENERAL",
  TEACHER_PART_TIME = "TEACHER_PART_TIME",
  TEACHER_FULL_TIME = "TEACHER_FULL_TIME",
  RECEPTIONIST = "RECEPTIONIST",
  STUDENT = "STUDENT",
}

export const ROLE_TAG = {
  [RoleName.ADMIN]: "red",
  [RoleName.MANAGE]: "orange",
  [RoleName.STAFF_ACADEMIC]: "cyan",
  [RoleName.STAFF_GENERAL]: "magenta",
  [RoleName.TEACHER_FULL_TIME]: "blue",
  [RoleName.TEACHER_PART_TIME]: "geekblue",
  [RoleName.RECEPTIONIST]: "purple",
  [RoleName.STUDENT]: "green",
};

export const ROLE_LABEL = {
  [RoleName.ADMIN]: "Admin",
  [RoleName.MANAGE]: "Manager",
  [RoleName.STAFF_ACADEMIC]: "Nhân viên đào tạo",
  [RoleName.STAFF_GENERAL]: "Nhân viên tổng hợp",
  [RoleName.TEACHER_FULL_TIME]: "Giáo viên full-time",
  [RoleName.TEACHER_PART_TIME]: "Giáo viên part-time",
  [RoleName.RECEPTIONIST]: "Nhân viên lễ tân",
  [RoleName.STUDENT]: "Học viên",
};

export const RoleOptions = Object.entries(ROLE_LABEL).map(([value, label]) => ({
  label,
  value,
}));

export const TeacherRoleOptions = RoleOptions.filter(
  (option) =>
    option.value === RoleName.TEACHER_FULL_TIME ||
    option.value === RoleName.TEACHER_PART_TIME,
);

export const StaffRoleOptions = RoleOptions.filter(
  (option) =>
    option.value === RoleName.STAFF_ACADEMIC ||
    option.value === RoleName.STAFF_GENERAL ||
    option.value === RoleName.RECEPTIONIST,
);

export const ManagerRoleOptions = RoleOptions.filter(
  (option) =>
    option.value === RoleName.ADMIN || option.value === RoleName.MANAGE,
);
