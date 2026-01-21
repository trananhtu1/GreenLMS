import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { UserStatus } from '../enums';
import { ScheduleType } from '../enums/schedule.enum';
import type { ClassEntity } from './class.entity';
import { CustomBaseEntity } from './customBase.entity';
import type { RequestEntity } from './request.entity';

@Entity({
  name: 'schedules',
})
export class ScheduleEntity extends CustomBaseEntity {
  @Column()
  name: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: ScheduleType,
  })
  type: ScheduleType;

  @Column({
    name: 'start_date',
    type: 'timestamptz',
  })
  startDate: Date;

  @Column({
    name: 'end_date',
    type: 'timestamptz',
  })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({
    name: 'request_id',
    nullable: true,
  })
  requestId: string;

  @ManyToOne('RequestEntity', 'schedules')
  @JoinColumn({
    name: 'request_id',
  })
  request: RequestEntity;

  @Column({
    name: 'teacher_id',
    nullable: true,
  })
  teacherId: string;

  @Column({
    name: 'class_id',
    nullable: true,
  })
  classId: string;

  @ManyToOne('ClassEntity', 'schedules')
  @JoinColumn({
    name: 'class_id',
  })
  class: ClassEntity;
}
