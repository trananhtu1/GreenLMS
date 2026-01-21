import {
  NotificationEntity,
  UpdateNotificationStatusDto,
} from '@class-operation/libs';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BaseService } from '../../common';

@Injectable()
export class NotificationService extends BaseService<NotificationEntity> {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
  ) {
    super(notificationRepository);
  }

  async markAllAsRead(
    updateNotificationStatusDto: UpdateNotificationStatusDto,
    userId: string,
  ) {
    const { notificationIds } = updateNotificationStatusDto;

    await this.notificationRepository.update(
      {
        id: In(notificationIds),
        userId,
      },
      {
        read: true,
      },
    );
  }
}
