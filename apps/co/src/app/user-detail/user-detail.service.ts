import { UserDetail } from '@class-operation/libs';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common';

@Injectable()
export class UserDetailService extends BaseService<UserDetail> {
  constructor(
    @InjectRepository(UserDetail)
    private readonly userDetailRepository: Repository<UserDetail>,
  ) {
    super(userDetailRepository);
  }

  async createUserDetail(detailData: any): Promise<UserDetail> {
    return this.store(detailData);
  }
}
