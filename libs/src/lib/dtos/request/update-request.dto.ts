import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { RequestAction, RequestPriority } from '../../enums';
import { UpdateWeeklyNormDto } from '../weekly-norm/update-weekly-norm.dto';

export class UpdateRequestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  @IsOptional()
  requesterId?: string;

  @IsUUID()
  @IsOptional()
  approverId?: string;
}

export class UpdateRequestStatusDto {
  @IsNotEmpty()
  @IsEnum(RequestAction)
  action: RequestAction;
}

/**
 * Weekly Norms Request Update DTOs
 */
export class UpdateWeeklyNormRequestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateWeeklyNormDto)
  @IsOptional()
  weeklyNorms?: UpdateWeeklyNormDto[];
}

/**
 * Time-Offs Request Update DTOs
 */
export class UpdateTimeOffScheduleDto {
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate: Date;
}

export class UpdateTimeOffRequestDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTimeOffScheduleDto)
  @IsOptional()
  schedules?: UpdateTimeOffScheduleDto[];
}

/**
 * Busy Schedules Request Update DTOs
 */
export class UpdateBusySchedulesRequestDto {
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

export class UpdateSupportTicketRequestDto {
  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsEnum(RequestPriority)
  priority?: RequestPriority;
}
