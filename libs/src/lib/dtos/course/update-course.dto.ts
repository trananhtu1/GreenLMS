import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserStatus } from '../../enums';
import { CourseType } from '../../enums/course.enum';

export class UpdateCourseDto {
  @IsEmpty()
  code: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({
    required: false,
    enum: CourseType,
    enumName: 'CourseType',
  })
  @IsOptional()
  @IsEnum(CourseType)
  type?: CourseType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber({}, { message: 'Hours must be a valid number' })
  hours?: number;
}
