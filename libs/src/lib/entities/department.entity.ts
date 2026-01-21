import { Column, Entity, OneToMany } from 'typeorm';
import { CustomBaseEntity } from './customBase.entity';
import { UserDetail } from './user-detail.entity';

@Entity({ name: 'departments' })
export class DepartmentEntity extends CustomBaseEntity {
  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({
    nullable: true,
  })
  description: string;

  @OneToMany('UserDetail', 'department')
  users: UserDetail[];
}
