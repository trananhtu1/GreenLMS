import { Expose, Transform, Type } from 'class-transformer';
import { UserStatus } from '../../enums';
import { StudentClassesDto } from '../class/class.dto';
import { BaseDto } from '../common/base.dto';
import { RoleDto } from '../role/role.dto';
import { DetailUserDto } from './detail-user.dto';

export class UserDto extends BaseDto {
  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;

  @Expose()
  @Transform(({ obj }) => `${obj.lastName} ${obj.firstName}`)
  fullName: string;

  @Expose()
  phoneNumber: string;

  @Expose()
  avatar: string;

  @Expose()
  status: UserStatus;

  @Expose({
    groups: ['admin'],
  })
  lastLogin: Date;

  @Expose()
  @Type(() => RoleDto)
  role: RoleDto;

  @Expose()
  @Type(() => DetailUserDto)
  detail: DetailUserDto;

  @Expose()
  @Type(() => StudentClassesDto)
  students: StudentClassesDto[];
}
