import { CounterEntity, CounterType } from '@class-operation/libs';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common';

@Injectable()
export class CounterService extends BaseService<CounterEntity> {
  constructor(
    @InjectRepository(CounterEntity)
    private readonly counterRepository: Repository<CounterEntity>,
  ) {
    super(counterRepository);
  }

  async getNextCode(counterType: CounterType): Promise<string> {
    const counter = await this.findOne({
      where: {
        type: counterType,
      },
    });

    if (!counter) {
      throw new InternalServerErrorException(
        `Counter not found for type ${counterType}`,
      );
    }

    counter.count += 1;
    await this.store(counter);

    return `${counter.type}${counter.count.toString().padStart(4, '0')}`;
  }
}
