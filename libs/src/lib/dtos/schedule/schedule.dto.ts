import { Exclude, Expose } from 'class-transformer';
import { RequestStatus } from '../../enums/request.enum';
import { ScheduleType } from '../../enums/schedule.enum';
import { BaseDto } from '../common/base.dto';

@Exclude()
export class ScheduleDto extends BaseDto {
  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  type: ScheduleType;

  @Expose()
  startDate: Date;

  @Expose()
  endDate: Date;

  @Expose()
  status: RequestStatus;
}
