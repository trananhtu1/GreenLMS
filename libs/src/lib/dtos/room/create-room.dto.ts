import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserStatus } from '../../enums';
import { BaseRequestDto } from '../common/baseRequest.dto';

export class CreateRoomDto extends BaseRequestDto {
  @ApiProperty({ description: 'Room name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ required: false, description: 'Room quantity' })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiProperty({ required: false, description: 'Room location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false, description: 'Room description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, description: 'Room status', default: true })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
