import {
  CourseDto,
  CreateCourseDto,
  Pagination,
  QueryCourseDto,
  ResponseDto,
  RoleName,
  Roles,
  UpdateCourseDto,
} from '@class-operation/libs';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CourseService } from './course.service';

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get('/')
  @Roles(
    RoleName.ADMIN,
    RoleName.MANAGE,
    RoleName.STAFF_ACADEMIC,
    RoleName.TEACHER_FULL_TIME,
    RoleName.TEACHER_PART_TIME,
    RoleName.STUDENT,
  )
  async find(@Query() queryParams: QueryCourseDto) {
    const {
      page,
      limit,
      total,
      data: courses,
    } = await this.courseService.query(queryParams);

    const results: Pagination<CourseDto> = {
      page,
      limit,
      total,
      items: CourseDto.plainToInstance(courses, ['admin']),
    };

    return new ResponseDto(HttpStatus.OK, 'Success', results);
  }

  @Get('/:id')
  @Roles(RoleName.ADMIN, RoleName.STAFF_ACADEMIC)
  async findById(@Param('id') id: string) {
    const course = await this.courseService.findById(id);

    return new ResponseDto(
      HttpStatus.OK,
      'Success',
      CourseDto.plainToInstance(course, ['admin']),
    );
  }

  @Post('/')
  @Roles(RoleName.ADMIN, RoleName.STAFF_ACADEMIC)
  async create(@Body() createCourseDto: CreateCourseDto) {
    const course = await this.courseService.create(createCourseDto);

    return new ResponseDto(
      HttpStatus.CREATED,
      'Created a new course',
      CourseDto.plainToInstance(course, ['admin']),
    );
  }

  @Put('/:id')
  @Roles(RoleName.ADMIN, RoleName.STAFF_ACADEMIC)
  async updateById(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    const course = await this.courseService.updateById(id, updateCourseDto);

    return new ResponseDto(
      HttpStatus.OK,
      'Updated a course',
      CourseDto.plainToInstance(course, ['admin']),
    );
  }

  @Delete('/:id')
  @Roles(RoleName.ADMIN, RoleName.STAFF_ACADEMIC)
  async deleteById(@Param('id') id: string) {
    await this.courseService.deleteById(id);

    return new ResponseDto(HttpStatus.OK, 'Deleted a course');
  }
}
