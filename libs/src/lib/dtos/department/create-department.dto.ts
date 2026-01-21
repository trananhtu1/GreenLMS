import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class CreateDepartmentDto {
  @Expose()
  @IsString()
  @IsOptional()
  code?: string;

  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsString()
  @IsOptional()
  description?: string;
}
