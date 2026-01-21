import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmpty,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { UserStatus } from '../../enums';

export class CreateClassDto {
  @IsEmpty()
  code: string;

  @ApiProperty({ description: 'Class name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ required: false, description: 'Class description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, description: 'Start date of the class' })
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @ApiProperty({ required: false, description: 'End date of the class' })
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @ApiProperty({
    required: false,
    description: 'Maximum number of students',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiProperty({
    required: false,
    description: 'Class status',
    default: false,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({ description: 'Course ID that this class belongs to' })
  @IsNotEmpty()
  @IsUUID()
  courseId: string;

  @ApiProperty({ required: false, description: 'Teacher ID for this class' })
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiProperty({ required: false, description: 'Room ID for this class' })
  @IsOptional()
  @IsUUID()
  roomId?: string;
}
