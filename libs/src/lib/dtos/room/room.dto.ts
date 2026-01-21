import { Expose } from 'class-transformer';
import { UserStatus } from '../../enums';
import { BaseDto } from '../common/base.dto';

export class RoomDto extends BaseDto {
  @Expose()
  code: string;

  @Expose()
  name: string;

  @Expose()
  quantity: number;

  @Expose()
  location: string;

  @Expose()
  description: string;

  @Expose()
  status: UserStatus;
}
