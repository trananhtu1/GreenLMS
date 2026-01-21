import {
  RequestEntity,
  ScheduleEntity,
  SupportTicketEntity,
  WeeklyNormEntity,
} from '@class-operation/libs';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FieldModule } from '../field/field.module';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { SupportTicketModule } from '../support-ticket/support-ticket.module';
import { UserDetailModule } from '../user-detail/user-detail.module';
import { WeeklyNormModule } from '../weekly-norm/weekly-norm.module';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RequestEntity,
      ScheduleEntity,
      WeeklyNormEntity,
      SupportTicketEntity,
    ]),
    ScheduleModule,
    WeeklyNormModule,
    FieldModule,
    UserDetailModule,
    RabbitMQModule,
    SupportTicketModule,
  ],
  providers: [RequestService],
  controllers: [RequestController],
  exports: [RequestService],
})
export class RequestModule {}
