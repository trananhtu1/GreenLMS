import { CounterType, RoleName } from '../enums';

export const ROLE_COUNTER_TYPE: Record<RoleName, CounterType> = {
  [RoleName.ADMIN]: CounterType.NV,
  [RoleName.MANAGE]: CounterType.NV,
  [RoleName.STAFF_ACADEMIC]: CounterType.NV,
  [RoleName.STAFF_GENERAL]: CounterType.NV,
  [RoleName.TEACHER_FULL_TIME]: CounterType.GV,
  [RoleName.TEACHER_PART_TIME]: CounterType.GV,
  [RoleName.RECEPTIONIST]: CounterType.NV,
  [RoleName.STUDENT]: CounterType.HV,
};
