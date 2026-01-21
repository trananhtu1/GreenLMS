import {
  CounterType,
  CreateDepartmentDto,
  DepartmentEntity,
  UpdateDepartmentDto,
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
export class DepartmentService extends BaseService<DepartmentEntity> {
  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,
    private readonly counterService: CounterService,
  ) {
    super(departmentRepository);
  }

  async findById(id: string): Promise<DepartmentEntity> {
    const department = await this.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  async findByName(name: string): Promise<DepartmentEntity | null> {
    return this.departmentRepository.findOne({ where: { name } });
  }

  async findByCode(code: string): Promise<DepartmentEntity | null> {
    return this.departmentRepository.findOne({ where: { code } });
  }

  async create(
    createDepartmentDto: CreateDepartmentDto,
  ): Promise<DepartmentEntity> {
    // Check if department with same code already exists
    if (createDepartmentDto.code) {
      const existingDepartment = await this.findByCode(
        createDepartmentDto.code,
      );
      if (existingDepartment) {
        throw new BadRequestException(
          'Department with this code already exists',
        );
      }
    } else {
      // Auto-generate code if not provided
      createDepartmentDto.code = await this.counterService.getNextCode(
        CounterType.PB,
      );
    }

    // Check if department with same name already exists
    if (createDepartmentDto.name) {
      const existingDepartment = await this.findByName(
        createDepartmentDto.name,
      );
      if (existingDepartment) {
        throw new BadRequestException(
          'Department with this name already exists',
        );
      }
    }

    return this.store(createDepartmentDto);
  }

  async updateById(
    id: string,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<DepartmentEntity> {
    const department = await this.findById(id);

    // Don't allow code to be changed if specified
    if (
      updateDepartmentDto.code &&
      updateDepartmentDto.code !== department.code
    ) {
      const existingDepartment = await this.findByCode(
        updateDepartmentDto.code,
      );
      if (existingDepartment && existingDepartment.id !== id) {
        throw new BadRequestException(
          'Department with this code already exists',
        );
      }
    }

    // Check if name is being changed and if it's already taken
    if (
      updateDepartmentDto.name &&
      updateDepartmentDto.name !== department.name
    ) {
      const existingDepartment = await this.findByName(
        updateDepartmentDto.name,
      );
      if (existingDepartment && existingDepartment.id !== id) {
        throw new BadRequestException(
          'Department with this name already exists',
        );
      }
    }

    return this.store({
      ...department,
      ...updateDepartmentDto,
    });
  }

  async deleteById(id: string): Promise<DepartmentEntity> {
    const department = await this.findById(id);

    await this.delete(id);

    return department;
  }
}
