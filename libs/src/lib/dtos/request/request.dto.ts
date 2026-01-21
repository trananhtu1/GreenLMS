import { Exclude, Expose, Type } from 'class-transformer';
import { RequestStatus, RequestType } from '../../enums';
import { BaseDto } from '../common/base.dto';
import { ScheduleDto } from '../schedule/schedule.dto';
import { UserDto } from '../user/user.dto';
import { WeeklyNormDto } from '../weekly-norm/weekly-norm.dto';
import { SupportTicketDto } from './../support-ticket/support-ticket.dto';

/**
 * Base Request DTO
 */
@Exclude()
export class RequestDto extends BaseDto {
  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  type: RequestType;

  @Expose()
  creatorId: string;

  @Expose()
  @Type(() => UserDto)
  creator: UserDto;

  @Expose()
  requesterId: string;

  @Expose()
  @Type(() => UserDto)
  requester: UserDto;

  @Expose()
  approverId: string;

  @Expose()
  @Type(() => UserDto)
  approver: UserDto;

  @Expose()
  @Type(() => WeeklyNormDto)
  weeklyNorms: WeeklyNormDto[];

  @Expose()
  status: RequestStatus;

  @Expose()
  @Type(() => ScheduleDto)
  schedules: ScheduleDto[];

  @Expose()
  @Type(() => SupportTicketDto)
  supportTicket: SupportTicketDto;
}
