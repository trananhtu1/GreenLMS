import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { UserStatus } from '../enums';
import type { ClassEntity } from './class.entity';
import { CustomBaseEntity } from './customBase.entity';
import type { FieldEntity } from './field.entity';
import type { NotificationEntity } from './notification.entity';
import type { RoleEntity } from './role.entity';
import type { StudentClassEntity } from './student-class.entity';
import type { UserDetail } from './user-detail.entity';

@Entity({ name: 'users' })
export class UserEntity extends CustomBaseEntity {
  @Column({
    name: 'first_name',
  })
  firstName: string;

  @Column({
    name: 'last_name',
  })
  lastName: string;

  @Column({
    unique: true,
  })
  email: string;

  @Column({
    select: false,
  })
  password: string;

  @Column({
    name: 'phone_number',
    nullable: true,
  })
  phoneNumber: string;

  @Column({
    nullable: true,
  })
  avatar: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({
    name: 'last_login',
    type: 'timestamptz',
    nullable: true,
  })
  lastLogin: Date;

  @Column({
    name: 'role_id',
  })
  roleId: string;

  @ManyToOne('RoleEntity', 'users')
  @JoinColumn({
    name: 'role_id',
  })
  role: RoleEntity;

  @Column({
    name: 'detail_user_id',
    nullable: true,
  })
  detailUserId: string;

  @OneToOne('UserDetail', 'user')
  @JoinColumn({
    name: 'detail_user_id',
  })
  detail: UserDetail;

  @OneToMany('ClassEntity', 'teacher')
  teachers: ClassEntity[];

  @OneToMany('StudentClassEntity', 'student')
  students: StudentClassEntity[];

  @OneToMany('NotificationEntity', 'user')
  notifications: NotificationEntity[];

  @OneToOne('FieldEntity', 'leader')
  leaderOfField: FieldEntity;
}
