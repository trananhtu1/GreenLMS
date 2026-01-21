import { Column, Entity, OneToMany } from 'typeorm';
import { UserStatus } from '../enums';
import type { ClassEntity } from './class.entity';
import { CustomBaseEntity } from './customBase.entity';

@Entity({ name: 'rooms' })
export class RoomEntity extends CustomBaseEntity {
  @Column({
    unique: true,
  })
  code: string;

  @Column()
  name: string;

  @Column({
    type: 'integer',
    default: 0,
  })
  quantity: number;

  @Column({
    nullable: true,
  })
  location: string;

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

  @OneToMany('ClassEntity', 'room')
  classes: ClassEntity[];
}
