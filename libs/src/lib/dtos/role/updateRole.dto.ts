import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { BaseRequestDto } from '../common/baseRequest.dto';

export class UpdateRoleDto extends BaseRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  roleName: string;
}
