import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { RoleName, TeacherLevel } from '../../enums';
import { BaseRequestDto } from '../common/baseRequest.dto';

export class UpdateUserDto extends BaseRequestDto {
  @ApiProperty()
  @IsOptional()
  @MinLength(1)
  firstName?: string;

  @ApiProperty()
  @IsOptional()
  @MinLength(1)
  lastName?: string;

  @ApiProperty()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty()
  @IsOptional()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must have at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password?: string;

  @ApiProperty()
  @IsOptional()
  confirmPassword?: string;

  @ApiProperty()
  @IsOptional()
  phoneNumber?: string;

  @IsOptional()
  avatar?: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(RoleName)
  roleName?: RoleName;

  @ApiProperty()
  @IsOptional()
  @Type(() => Number)
  status?: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  fieldId?: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(TeacherLevel)
  teacherLevel?: TeacherLevel;
}
