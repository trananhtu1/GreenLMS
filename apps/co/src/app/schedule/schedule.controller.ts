import {
  CreateTeachingSchedulesDto,
  GetScheduleDto,
  ResponseDto,
  RoleName,
  Roles,
  UpdateScheduleDto,
  User,
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
  Query,
} from '@nestjs/common';

import { ScheduleService } from './schedule.service';

@Controller('schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get('/')
  @Roles(
    RoleName.ADMIN,
    RoleName.MANAGE,
    RoleName.TEACHER_PART_TIME,
    RoleName.TEACHER_FULL_TIME,
    RoleName.RECEPTIONIST,
  )
  async findByRangeDate(
    @Query() query: GetScheduleDto,
    @User('userId') userId: string,
    @User('role') role: RoleName,
  ) {
    const result = await this.scheduleService.findByRangeDate(
      query,
      userId,
      role,
    );

    return new ResponseDto(
      HttpStatus.OK,
      'Schedules retrieved successfully',
      result,
    );
  }

  @Get('/student')
  @Roles(RoleName.STUDENT)
  async findByStudentClasses(
    @Query() query: GetScheduleDto,
    @User('userId') userId: string,
  ) {
    const result = await this.scheduleService.findByStudentClasses(
      query,
      userId,
    );

    return new ResponseDto(
      HttpStatus.OK,
      'Student class schedules retrieved successfully',
      result,
    );
  }

  @Get('/:id')
  @Roles(RoleName.ADMIN, RoleName.TEACHER_FULL_TIME)
  async findById(@Param('id') id: string) {
    const result = await this.scheduleService.findById(id);

    return new ResponseDto(
      HttpStatus.OK,
      'Schedule retrieved successfully',
      result,
    );
  }

  @Post('/teaching')
  @Roles(RoleName.ADMIN, RoleName.MANAGE, RoleName.STAFF_ACADEMIC)
  async createTeachingSchedules(
    @Body() createTeachingScheduleDto: CreateTeachingSchedulesDto,
  ) {
    const result = await this.scheduleService.createTeachingSchedules(
      createTeachingScheduleDto,
    );

    return new ResponseDto(
      HttpStatus.CREATED,
      'Teaching schedules created successfully',
      result,
    );
  }

  @Patch('/:id')
  @Roles(RoleName.ADMIN, RoleName.MANAGE, RoleName.STAFF_ACADEMIC)
  async updateSchedule(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    const result = await this.scheduleService.updateById(id, updateScheduleDto);
    return new ResponseDto(
      HttpStatus.OK,
      'Schedule updated successfully',
      result,
    );
  }

  @Delete('/:id')
  @Roles(RoleName.ADMIN, RoleName.MANAGE, RoleName.STAFF_ACADEMIC)
  async deleteSchedule(@Param('id') id: string) {
    await this.scheduleService.delete(id);
    return new ResponseDto(
      HttpStatus.OK,
      'Schedule deleted successfully',
      null,
    );
  }
}
