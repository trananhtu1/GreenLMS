import { Expose, Type } from 'class-transformer';
import { RequestPriority } from '../../enums';
import { ClassDto } from '../class/class.dto';
import { BaseDto } from '../common/base.dto';

export class SupportTicketDto extends BaseDto {
  @Expose()
  @Type(() => ClassDto)
  class: ClassDto;

  @Expose()
  priority: RequestPriority;

  @Expose()
  requestId: string;
}
