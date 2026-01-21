import {
  GetNotificationsDto,
  NotificationDto,
  Pagination,
  ResponseDto,
  UpdateNotificationStatusDto,
  User,
} from '@class-operation/libs';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('/')
  async getNotifications(
    @User('userId') userId: string,
    @Query() getNotificationsDto: GetNotificationsDto,
  ) {
    const { page, limit, total, data } = await this.notificationService.query({
      ...getNotificationsDto,
      userId,
    });

    const results: Pagination<NotificationDto> = {
      page,
      limit,
      total,
      items: NotificationDto.plainToInstance(data, ['admin']),
    };

    return new ResponseDto(HttpStatus.OK, 'Success', results);
  }

  @Get('/:id')
  async getNotificationById(@Param('id') id: string) {
    const notification = await this.notificationService.findOne({
      where: { id },
    });

    return new ResponseDto(
      HttpStatus.OK,
      'Success',
      NotificationDto.plainToInstance(notification),
    );
  }

  @Patch('/mark-all')
  async markAllAsRead(
    @User('userId') userId: string,
    @Body() updateNotificationStatusDto: UpdateNotificationStatusDto,
  ) {
    await this.notificationService.markAllAsRead(
      updateNotificationStatusDto,
      userId,
    );
    return new ResponseDto(
      HttpStatus.OK,
      'Selected notifications marked as read',
    );
  }
}
