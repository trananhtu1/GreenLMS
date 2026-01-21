import { UserDetail } from '@class-operation/libs';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDetailService } from './user-detail.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserDetail])],
  providers: [UserDetailService],
  exports: [UserDetailService],
})
export class UserDetailModule {}
