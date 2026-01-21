import { Expose } from 'class-transformer';
import { BaseDto } from '../common/base.dto';

export class NotificationDto extends BaseDto {
  @Expose()
  title: string;

  @Expose()
  read: boolean;

  @Expose()
  content?: string;
}
