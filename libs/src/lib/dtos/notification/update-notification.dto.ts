import { IsArray, IsString } from 'class-validator';

export class UpdateNotificationStatusDto {
  @IsArray()
  @IsString({ each: true })
  notificationIds: string[];
}
