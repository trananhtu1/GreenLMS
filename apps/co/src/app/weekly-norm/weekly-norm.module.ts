import {
  FieldEntity,
  RequestEntity,
  UserDetail,
  WeeklyNormEntity,
} from '@class-operation/libs';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeeklyNormController } from './weekly-norm.controller';
import { WeeklyNormService } from './weekly-norm.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WeeklyNormEntity,
      FieldEntity,
      UserDetail,
      RequestEntity,
    ]),
  ],
  controllers: [WeeklyNormController],
  providers: [WeeklyNormService],
  exports: [WeeklyNormService],
})
export class WeeklyNormModule {}
