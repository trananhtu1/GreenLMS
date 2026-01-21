import { SupportTicketEntity } from '@class-operation/libs';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common';

@Injectable()
export class SupportTicketService extends BaseService<SupportTicketEntity> {
  constructor(
    @InjectRepository(SupportTicketEntity)
    private readonly supportTicketRepository: Repository<SupportTicketEntity>,
  ) {
    super(supportTicketRepository);
  }
}
