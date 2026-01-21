import {
  CounterType,
  CourseEntity,
  CreateCourseDto,
  UpdateCourseDto,
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
export class CourseService extends BaseService<CourseEntity> {
  constructor(
    @InjectRepository(CourseEntity)
    private readonly courseRepository: Repository<CourseEntity>,
    private readonly counterService: CounterService,
  ) {
    super(courseRepository);
  }

  async findById(id: string): Promise<CourseEntity> {
    const course = await this.findOne({ where: { id } });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async findByCode(code: string): Promise<CourseEntity | null> {
    const course = await this.courseRepository.findOne({ where: { code } });
    return course;
  }

  async create(createCourseDto: CreateCourseDto): Promise<CourseEntity> {
    if (createCourseDto.code) {
      const existingCourse = await this.findByCode(createCourseDto.code);
      if (existingCourse) {
        throw new BadRequestException('Course with this code already exists');
      }
    } else {
      createCourseDto.code = await this.counterService.getNextCode(
        CounterType.KH,
      );
    }

    return this.store(createCourseDto);
  }

  async updateById(
    id: string,
    updateCourseDto: UpdateCourseDto,
  ): Promise<CourseEntity> {
    const course = await this.findById(id);

    // Don't allow code to be changed if specified
    if (updateCourseDto.code && updateCourseDto.code !== course.code) {
      const existingCourse = await this.findByCode(updateCourseDto.code);
      if (existingCourse && existingCourse.id !== id) {
        throw new BadRequestException('Course with this code already exists');
      }
    }

    return this.store({
      ...course,
      ...updateCourseDto,
    });
  }

  async deleteById(id: string): Promise<CourseEntity> {
    const course = await this.findById(id);

    await this.delete(id);

    return course;
  }
}
