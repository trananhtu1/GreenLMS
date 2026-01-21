import { NotificationEntity } from '@class-operation/libs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from '../email/email.module';
import { SocketModule } from '../socket/socket.module';
import { RabbitMQService } from './rabbitmq.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([NotificationEntity]),
    SocketModule,
    EmailModule,
  ],
  providers: [RabbitMQService],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}
