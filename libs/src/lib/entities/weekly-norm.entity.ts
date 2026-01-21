import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { UserStatus } from '../enums';
import { CustomBaseEntity } from './customBase.entity';
import type { RequestEntity } from './request.entity';

@Entity({ name: 'weekly_norms' })
export class WeeklyNormEntity extends CustomBaseEntity {
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
    type: 'integer',
    default: 0,
  })
  quantity: number;

  @Column({
    name: 'request_id',
  })
  requestId: string;

  @Column({
    name: 'teacher_id',
    nullable: true,
  })
  teacherId: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @ManyToOne('RequestEntity', 'weeklyNorms')
  @JoinColumn({
    name: 'request_id',
  })
  request: RequestEntity;
}
