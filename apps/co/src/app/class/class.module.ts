import {
  ClassEntity,
  CourseEntity,
  ScheduleEntity,
  StudentClassEntity,
  UserEntity,
} from '@class-operation/libs';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CounterModule } from '../counter/counter.module';
import { ClassController } from './class.controller';
import { ClassService } from './class.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClassEntity,
      ScheduleEntity,
      StudentClassEntity,
      UserEntity,
      CourseEntity,
    ]),
    CounterModule,
  ],
  controllers: [ClassController],
  providers: [ClassService],
  exports: [ClassService],
})
export class ClassModule {}
