import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationRequestDto } from '../common/pagination-request.dto';

export class QueryRoomDto extends PaginationRequestDto {
  @ApiProperty({ required: false, description: 'Search by room name' })
  @IsOptional()
  @IsString()
  name?: string;
}
