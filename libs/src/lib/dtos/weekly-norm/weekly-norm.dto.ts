import { Exclude, Expose } from 'class-transformer';
import { UserStatus } from '../../enums';
import { BaseDto } from '../common/base.dto';

@Exclude()
export class WeeklyNormDto extends BaseDto {
  @Expose()
  startDate: Date;

  @Expose()
  endDate: Date;

  @Expose()
  quantity: number;

  @Expose()
  status: UserStatus;

  @Expose()
  requestId: string;
}
