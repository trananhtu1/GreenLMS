import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { RoleName } from '../../enums';
import { BaseRequestDto } from '../common/baseRequest.dto';

export class CreateRoleDto extends BaseRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  roleName: RoleName;
}
