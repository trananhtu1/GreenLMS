import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { RoleName, TeacherLevel } from '../../enums';
import { BaseRequestDto } from '../common/baseRequest.dto';

export class CreateUserDto extends BaseRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @MinLength(1)
  firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  @MinLength(1)
  lastName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must have at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password: string;

  @ApiProperty()
  confirmPassword: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  @IsOptional()
  avatar?: any; // File will be processed by multer

  @ApiProperty()
  @IsEnum(RoleName)
  roleName: RoleName;

  @Type(() => Number)
  status: number;

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
