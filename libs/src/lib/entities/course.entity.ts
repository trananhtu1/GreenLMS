import { Column, Entity, OneToMany } from 'typeorm';
import { UserStatus } from '../enums';
import { CourseType } from '../enums/course.enum';
import { ClassEntity } from './class.entity';
import { CustomBaseEntity } from './customBase.entity';

@Entity({ name: 'courses' })
export class CourseEntity extends CustomBaseEntity {
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
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({
    type: 'enum',
    enum: CourseType,
  })
  type: CourseType;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 1,
    nullable: true,
    default: 0,
  })
  hours: number;

  @OneToMany('ClassEntity', 'course')
  classes: ClassEntity[];
}
