import { Column, Entity, OneToMany } from 'typeorm';
import { RoleName } from '../enums';
import { CustomBaseEntity } from './customBase.entity';
import type { UserEntity } from './user.entity';

@Entity({
  name: 'roles',
})
export class RoleEntity extends CustomBaseEntity {
  @Column({
    name: 'role_name',
    type: 'enum',
    enum: RoleName,
  })
  roleName: RoleName;

  @OneToMany('UserEntity', 'role')
  users: UserEntity[];
}
