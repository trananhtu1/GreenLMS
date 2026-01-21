import { CounterEntity } from '@class-operation/libs';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CounterService } from './counter.service';

@Module({
  imports: [TypeOrmModule.forFeature([CounterEntity])],
  providers: [CounterService],
  exports: [CounterService],
})
export class CounterModule {}
