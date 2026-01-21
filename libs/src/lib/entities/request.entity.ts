import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { RequestStatus, RequestType } from '../enums/request.enum';
import { CustomBaseEntity } from './customBase.entity';
import type { ScheduleEntity } from './schedule.entity';
import type { SupportTicketEntity } from './support-ticket.entity';
import type { UserEntity } from './user.entity';
import type { WeeklyNormEntity } from './weekly-norm.entity';

@Entity({
  name: 'requests',
})
export class RequestEntity extends CustomBaseEntity {
  @Column()
  name: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: RequestType,
  })
  type: RequestType;

  @Column({
    type: 'enum',
    enum: RequestStatus,
  })
  status: RequestStatus;

  @Column({
    name: 'creator_id',
  })
  creatorId: string;

  @ManyToOne('UserEntity')
  @JoinColumn({
    name: 'creator_id',
  })
  creator: UserEntity;

  @Column({
    name: 'requester_id',
    nullable: true,
  })
  requesterId: string;

  @ManyToOne('UserEntity')
  @JoinColumn({
    name: 'requester_id',
  })
  requester: UserEntity;

  @Column({
    name: 'approver_id',
    nullable: true,
  })
  approverId: string;

  @ManyToOne('UserEntity')
  @JoinColumn({
    name: 'approver_id',
  })
  approver: UserEntity;

  @OneToMany('WeeklyNormEntity', 'request')
  weeklyNorms: WeeklyNormEntity[];

  @OneToMany('ScheduleEntity', 'request')
  schedules: ScheduleEntity[];

  @OneToOne('SupportTicketEntity', 'request')
  supportTicket: SupportTicketEntity;
}
