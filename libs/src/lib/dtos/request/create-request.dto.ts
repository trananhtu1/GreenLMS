import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEmpty,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { RequestPriority, RequestStatus } from '../../enums';
import { CreateWeeklyNormDto } from '../weekly-norm/create-weekly-norm.dto';

/**
 * Weekly Norms Request DTOs
 */
export class CreateWeeklyNormRequestDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  description: string;

  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @IsOptional()
  @IsUUID()
  creatorId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWeeklyNormDto)
  weeklyNorms: CreateWeeklyNormDto[];

  @IsEmpty()
  status: RequestStatus;
}

/**
 * Time-Offs Request DTOs
 */
export class CreateTimeOffScheduleDto {
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate: Date;
}

export class CreateTimeOffRequestDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTimeOffScheduleDto)
  @IsNotEmpty()
  schedules: CreateTimeOffScheduleDto[];
}

/**
 * Busy Schedules Request DTOs
 */
export class CreateBusySchedulesRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  endDate: Date;
}

// For backward compatibility
export { CreateTimeOffRequestDto as CreateScheduleRequestDto };

/**
 * Support Ticket Request DTOs
 */
export class CreateSupportTicketRequestDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @IsNotEmpty()
  @IsUUID()
  classId: string;

  @IsNotEmpty()
  @IsEnum(RequestPriority)
  priority: RequestPriority;

  @IsEmpty()
  status: RequestStatus;

  @IsEmpty()
  creatorId?: string;

  @IsEmpty()
  requesterId?: string;
}
