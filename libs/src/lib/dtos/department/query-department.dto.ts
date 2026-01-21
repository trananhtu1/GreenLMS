import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { PaginationRequestDto } from '../common/pagination-request.dto';

export class QueryDepartmentDto extends PaginationRequestDto {
  @Expose()
  @IsString()
  @IsOptional()
  search?: string;
}
