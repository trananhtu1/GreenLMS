import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { UserStatus } from '../enums';
import type { CourseEntity } from './course.entity';
import { CustomBaseEntity } from './customBase.entity';
import type { RoomEntity } from './room.entity';
import type { ScheduleEntity } from './schedule.entity';
import type { StudentClassEntity } from './student-class.entity';
import type { SupportTicketEntity } from './support-ticket.entity';
import type { UserEntity } from './user.entity';

@Entity({ name: 'classes' })
export class ClassEntity extends CustomBaseEntity {
  @Column({
    unique: true,
  })
  code: string;

  @Column()
  name: string;

  @Column({
    nullable: true,
  })
  description: string;

  @Column({
    name: 'start_date',
    type: 'timestamptz',
    nullable: true,
  })
  startDate: Date;

  @Column({
    name: 'end_date',
    type: 'timestamptz',
    nullable: true,
  })
  endDate: Date;

  @Column({
    type: 'integer',
    default: 0,
  })
  quantity: number;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({
    name: 'course_id',
  })
  courseId: string;

  @ManyToOne('CourseEntity', 'classes')
  @JoinColumn({
    name: 'course_id',
  })
  course: CourseEntity;

  @Column({
    name: 'teacher_id',
    nullable: true,
  })
  teacherId: string;

  @ManyToOne('UserEntity', 'teachers')
  @JoinColumn({
    name: 'teacher_id',
  })
  teacher: UserEntity;

  @OneToMany('StudentClassEntity', 'class')
  @JoinColumn()
  studentClasses: StudentClassEntity[];

  @Column({
    name: 'room_id',
    nullable: true,
  })
  roomId: string;

  @ManyToOne('RoomEntity', 'classes', {
    nullable: true,
  })
  @JoinColumn({
    name: 'room_id',
  })
  room: RoomEntity;

  @OneToMany('ScheduleEntity', 'class')
  schedules: ScheduleEntity[];

  @OneToMany('SupportTicketEntity', 'class')
  supportTickets: SupportTicketEntity[];
}
