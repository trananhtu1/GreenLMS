import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CourseType } from '../../enums/course.enum';
import { PaginationRequestDto } from '../common/pagination-request.dto';

export class QueryCourseDto extends PaginationRequestDto {
  @ApiProperty({ required: false, description: 'Search by course name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by course type',
    enum: CourseType,
    enumName: 'CourseType',
  })
  @IsOptional()
  @IsEnum(CourseType)
  type?: CourseType;
}
