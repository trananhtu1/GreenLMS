import {
  GetWeeklyNormDto,
  ResponseDto,
  RoleName,
  Roles,
  User,
} from '@class-operation/libs';
import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { WeeklyNormService } from './weekly-norm.service';

@Controller('weekly-norms')
export class WeeklyNormController {
  constructor(private readonly weeklyNormService: WeeklyNormService) {}

  @Get('/')
  @Roles(
    RoleName.ADMIN,
    RoleName.MANAGE,
    RoleName.TEACHER_FULL_TIME,
    RoleName.TEACHER_PART_TIME,
    RoleName.RECEPTIONIST,
    RoleName.STAFF_ACADEMIC,
  )
  async findByRangeDate(
    @Query() query: GetWeeklyNormDto,
    @User('userId') userId: string,
    @User('role') role: RoleName,
  ) {
    const result = await this.weeklyNormService.findByRangeDate(
      query,
      userId,
      role,
    );

    return new ResponseDto(
      HttpStatus.OK,
      'Weekly norms retrieved successfully',
      result,
    );
  }
}
