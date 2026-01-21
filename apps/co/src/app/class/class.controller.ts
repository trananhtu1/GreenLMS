import {
  ClassDto,
  CreateClassDto,
  Pagination,
  QueryClassDto,
  ResponseDto,
  RoleName,
  Roles,
  StudentClassesDto,
  UpdateClassDto,
  User,
  UserDto,
  UserStatus,
} from '@class-operation/libs';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ClassService } from './class.service';

@Controller('classes')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Get('/')
  @Roles(
    RoleName.ADMIN,
    RoleName.MANAGE,
    RoleName.STAFF_ACADEMIC,
    RoleName.TEACHER_FULL_TIME,
    RoleName.TEACHER_PART_TIME,
  )
  async find(@Query() queryParams: QueryClassDto) {
    const {
      page,
      limit,
      total,
      data: classes,
    } = await this.classService.query(queryParams, {
      relations: ['course', 'room', 'teacher', 'studentClasses'],
    });

    const results: Pagination<ClassDto> = {
      page,
      limit,
      total,
      items: ClassDto.plainToInstance(classes, ['admin']),
    };

    return new ResponseDto(HttpStatus.OK, 'Success', results);
  }

  @Get('/my-classes')
  @Roles(
    RoleName.STUDENT,
    RoleName.TEACHER_FULL_TIME,
    RoleName.TEACHER_PART_TIME,
  )
  async findMyClasses(
    @Query() queryParams: QueryClassDto,
    @User('userId') userId: string,
    @User('role') role: RoleName,
  ) {
    const {
      page,
      limit,
      total,
      data: classes,
    } = await this.classService.queryMyClasses(queryParams, userId, role);

    const results: Pagination<ClassDto> = {
      page,
      limit,
      total,
      items: ClassDto.plainToInstance(classes, ['admin']),
    };

    return new ResponseDto(HttpStatus.OK, 'Success', results);
  }

  @Get('/:id')
  @Roles(
    RoleName.ADMIN,
    RoleName.MANAGE,
    RoleName.STAFF_ACADEMIC,
    RoleName.TEACHER_FULL_TIME,
    RoleName.TEACHER_PART_TIME,
    RoleName.STUDENT,
  )
  async findById(@Param('id') id: string) {
    const classEntity = await this.classService.findById(id);

    return new ResponseDto(
      HttpStatus.OK,
      'Success',
      ClassDto.plainToInstance(classEntity, ['admin']),
    );
  }

  @Get('/:id/students')
  @Roles(
    RoleName.ADMIN,
    RoleName.MANAGE,
    RoleName.STAFF_ACADEMIC,
    RoleName.TEACHER_FULL_TIME,
    RoleName.TEACHER_PART_TIME,
    RoleName.STUDENT,
  )
  async findStudentsByClassId(@Param('id') id: string) {
    const students = await this.classService.findStudentsByClassId(id);

    return new ResponseDto(
      HttpStatus.OK,
      'Success',
      StudentClassesDto.plainToInstance(students, ['admin']),
    );
  }

  @Post('/')
  @Roles(RoleName.ADMIN, RoleName.STAFF_ACADEMIC)
  async create(@Body() createClassDto: CreateClassDto) {
    const classEntity = await this.classService.create(createClassDto);

    return new ResponseDto(
      HttpStatus.CREATED,
      'Created a new class',
      ClassDto.plainToInstance(classEntity, ['admin']),
    );
  }

  @Put('/:id')
  @Roles(RoleName.ADMIN, RoleName.STAFF_ACADEMIC)
  async updateById(
    @Param('id') id: string,
    @Body() updateClassDto: UpdateClassDto,
  ) {
    const classEntity = await this.classService.updateById(id, updateClassDto);

    return new ResponseDto(
      HttpStatus.OK,
      'Updated a class',
      ClassDto.plainToInstance(classEntity, ['admin']),
    );
  }

  @Delete('/:id')
  @Roles(RoleName.ADMIN, RoleName.STAFF_ACADEMIC)
  async deleteById(@Param('id') id: string) {
    await this.classService.deleteById(id);

    return new ResponseDto(HttpStatus.OK, 'Deleted a class');
  }

  @Get('/:id/schedules')
  @Roles(
    RoleName.ADMIN,
    RoleName.MANAGE,
    RoleName.STAFF_ACADEMIC,
    RoleName.TEACHER_FULL_TIME,
    RoleName.TEACHER_PART_TIME,
  )
  async getSchedules(@Param('id') id: string) {
    const result = await this.classService.getSchedules(id);

    return new ResponseDto(
      HttpStatus.CREATED,
      'Created schedules successfully',
      result,
    );
  }

  @Post('/:id/students/:studentId')
  @Roles(RoleName.ADMIN, RoleName.STAFF_ACADEMIC)
  async addStudentToClass(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    await this.classService.addStudentToClass(id, studentId);

    return new ResponseDto(
      HttpStatus.OK,
      'Student added to class successfully',
    );
  }

  @Delete('/:id/students/:studentId')
  @Roles(RoleName.ADMIN, RoleName.STAFF_ACADEMIC)
  async removeStudentFromClass(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    await this.classService.removeStudentFromClass(id, studentId);

    return new ResponseDto(
      HttpStatus.OK,
      'Student removed from class successfully',
    );
  }

  @Get('/students/available')
  @Roles(RoleName.ADMIN, RoleName.STAFF_ACADEMIC)
  async findAvailableStudents(@Query() query: Record<string, any>) {
    const { page, limit, total, data } =
      await this.classService.findAvailableStudents(query);

    const results: Pagination<UserDto> = {
      page,
      limit,
      total,
      items: UserDto.plainToInstance(data, ['admin']),
    };

    return new ResponseDto(HttpStatus.OK, 'Success', results);
  }

  @Put('/:id/status')
  @Roles(RoleName.ADMIN, RoleName.STAFF_ACADEMIC)
  async updateClassStatus(
    @Param('id') id: string,
    @Body() { status }: { status: UserStatus },
  ) {
    const classEntity = await this.classService.updateClassStatus(id, status);

    return new ResponseDto(
      HttpStatus.OK,
      'Updated class status',
      ClassDto.plainToInstance(classEntity, ['admin']),
    );
  }

  @Get('/:id/statistics')
  @Roles(
    RoleName.ADMIN,
    RoleName.MANAGE,
    RoleName.STAFF_ACADEMIC,
    RoleName.TEACHER_FULL_TIME,
    RoleName.TEACHER_PART_TIME,
  )
  async getClassStatistics(@Param('id') id: string) {
    const statistics = await this.classService.getClassStatistics(id);

    return new ResponseDto(
      HttpStatus.OK,
      'Class statistics retrieved successfully',
      statistics,
    );
  }

  @Patch('/students/:studentClassId/status')
  @Roles(RoleName.ADMIN, RoleName.STAFF_ACADEMIC)
  async updateStudentStatus(
    @Param('studentClassId') studentClassId: string,
    @Body() { status }: { status: UserStatus },
  ) {
    const student = await this.classService.updateStudentStatus(
      studentClassId,
      status,
    );

    return new ResponseDto(
      HttpStatus.OK,
      'Student status updated successfully',
      UserDto.plainToInstance(student, ['admin']),
    );
  }
}
