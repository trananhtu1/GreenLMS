import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { RequestPriority } from '../enums';
import { ClassEntity } from './class.entity';
import { CustomBaseEntity } from './customBase.entity';
import { RequestEntity } from './request.entity';

@Entity({
  name: 'support_tickets',
})
export class SupportTicketEntity extends CustomBaseEntity {
  @Column({
    name: 'request_id',
  })
  requestId: string;

  @OneToOne(
    () => RequestEntity,
    (request: RequestEntity) => request.supportTicket,
  )
  @JoinColumn({
    name: 'request_id',
  })
  request: RequestEntity;

  @Column({
    name: 'class_id',
  })
  classId: string;

  @ManyToOne(
    () => ClassEntity,
    (classEntity: ClassEntity) => classEntity.supportTickets,
  )
  @JoinColumn({
    name: 'class_id',
  })
  class: ClassEntity;

  @Column({
    type: 'enum',
    enum: RequestPriority,
  })
  priority: RequestPriority;
}
