import { SupportTicketEntity } from '@class-operation/libs';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportTicketService } from './support-ticket.service';

@Module({
  imports: [TypeOrmModule.forFeature([SupportTicketEntity])],
  providers: [SupportTicketService],
  exports: [SupportTicketService],
})
export class SupportTicketModule {}
