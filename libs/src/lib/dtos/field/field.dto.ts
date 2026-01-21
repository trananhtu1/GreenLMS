import { Expose, Transform, Type } from 'class-transformer';
import { BaseDto } from '../common/base.dto';

export class SimpleUserDto extends BaseDto {
  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  @Transform(({ obj }) => `${obj.lastName} ${obj.firstName}`)
  fullName: string;
}

export class FieldDto extends BaseDto {
  @Expose()
  code: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  leaderId: string;

  @Expose()
  @Type(() => SimpleUserDto)
  leader: SimpleUserDto;
}
