import { ClassEntity } from './class.entity';
import { CounterEntity } from './counter.entity';
import { CourseEntity } from './course.entity';
import { DepartmentEntity } from './department.entity';
import { FieldEntity } from './field.entity';
import { NotificationEntity } from './notification.entity';
import { RequestEntity } from './request.entity';
import { RoleEntity } from './role.entity';
import { RoomEntity } from './room.entity';
import { ScheduleEntity } from './schedule.entity';
import { StudentClassEntity } from './student-class.entity';
import { SupportTicketEntity } from './support-ticket.entity';
import { UserDetail } from './user-detail.entity';
import { UserEntity } from './user.entity';
import { WeeklyNormEntity } from './weekly-norm.entity';

export const ListEntity = [
  RoleEntity,
  UserEntity,
  UserDetail,
  CounterEntity,
  RequestEntity,
  WeeklyNormEntity,
  ScheduleEntity,
  RoomEntity,
  CourseEntity,
  ClassEntity,
  StudentClassEntity,
  NotificationEntity,
  DepartmentEntity,
  FieldEntity,
  SupportTicketEntity,
] as const;
