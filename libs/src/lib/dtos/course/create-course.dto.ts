import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmpty,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserStatus } from '../../enums';
import { CourseType } from '../../enums/course.enum';

export class CreateCourseDto {
  @IsEmpty()
  code: string;

  @ApiProperty({ description: 'Course name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ required: false, description: 'Course description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    required: false,
    description: 'Course status',
    default: false,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({
    description: 'Course type',
    enum: CourseType,
    enumName: 'CourseType',
  })
  @IsNotEmpty()
  @IsEnum(CourseType)
  type: CourseType;

  @ApiProperty({ required: false, description: 'Course hours' })
  @IsOptional()
  @IsNumber({}, { message: 'Hours must be a valid number' })
  hours?: number;
}
