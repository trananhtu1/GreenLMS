import {
  CounterType,
  CreateFieldDto,
  FieldEntity,
  UpdateFieldDto,
  UserEntity,
} from '@class-operation/libs';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common';
import { CounterService } from '../counter/counter.service';

@Injectable()
export class FieldService extends BaseService<FieldEntity> {
  constructor(
    @InjectRepository(FieldEntity)
    private readonly fieldRepository: Repository<FieldEntity>,
    private readonly counterService: CounterService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    super(fieldRepository);
  }

  async findById(id: string): Promise<FieldEntity> {
    const field = await this.findOne({
      where: { id },
      relations: ['leader', 'teachers'],
    });

    if (!field) {
      throw new NotFoundException('Field not found');
    }

    return field;
  }

  async findByName(name: string): Promise<FieldEntity | null> {
    return this.fieldRepository.findOne({ where: { name } });
  }

  async findByCode(code: string): Promise<FieldEntity | null> {
    return this.fieldRepository.findOne({ where: { code } });
  }

  async create(createFieldDto: CreateFieldDto): Promise<FieldEntity> {
    // Check if field with same code already exists
    if (createFieldDto.code) {
      const existingField = await this.findByCode(createFieldDto.code);
      if (existingField) {
        throw new BadRequestException('Field with this code already exists');
      }
    } else {
      // Auto-generate code if not provided
      createFieldDto.code = await this.counterService.getNextCode(
        CounterType.CC,
      );
    }

    // Check if field with same name already exists
    if (createFieldDto.name) {
      const existingField = await this.findByName(createFieldDto.name);
      if (existingField) {
        throw new BadRequestException('Field with this name already exists');
      }
    }

    // Validate leader exists if provided
    if (createFieldDto.leaderId) {
      await this.userRepository.findOne({
        where: { id: createFieldDto.leaderId },
      });

      if (!createFieldDto.leaderId) {
        throw new NotFoundException('Leader not found');
      }
    }

    return this.store(createFieldDto);
  }

  async updateById(
    id: string,
    updateFieldDto: UpdateFieldDto,
  ): Promise<FieldEntity> {
    const field = await this.findById(id);

    // Don't allow code to be changed if specified
    if (updateFieldDto.code && updateFieldDto.code !== field.code) {
      const existingField = await this.findByCode(updateFieldDto.code);
      if (existingField && existingField.id !== id) {
        throw new BadRequestException('Field with this code already exists');
      }
    }

    // Check if name is being changed and if it's already taken
    if (updateFieldDto.name && updateFieldDto.name !== field.name) {
      const existingField = await this.findByName(updateFieldDto.name);
      if (existingField && existingField.id !== id) {
        throw new BadRequestException('Field with this name already exists');
      }
    }

    let leader = null;
    // Validate leader exists if being updated
    if (updateFieldDto.leaderId && updateFieldDto.leaderId !== field.leaderId) {
      leader = await this.userRepository.findOne({
        where: { id: updateFieldDto.leaderId },
      });

      if (!leader) {
        throw new NotFoundException('Leader not found');
      }
    }

    return this.store({
      ...field,
      ...updateFieldDto,
      leader,
    });
  }

  async deleteById(id: string): Promise<FieldEntity> {
    const field = await this.findById(id);

    await this.delete(id);

    return field;
  }
}
