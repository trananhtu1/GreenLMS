import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { UserStatus } from '../enums';
import type { ClassEntity } from './class.entity';
import { CustomBaseEntity } from './customBase.entity';
import type { UserEntity } from './user.entity';

@Entity({ name: 'student_class' })
export class StudentClassEntity extends CustomBaseEntity {
  @Column({ name: 'class_id' })
  classId: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @ManyToOne('ClassEntity', 'studentClasses')
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity;

  @ManyToOne('UserEntity', 'students')
  @JoinColumn({ name: 'student_id' })
  student: UserEntity;
}
