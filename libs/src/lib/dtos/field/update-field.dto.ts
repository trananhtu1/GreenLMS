import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class UpdateFieldDto {
  @Expose()
  @IsString()
  @IsOptional()
  code?: string;

  @Expose()
  @IsString()
  @IsOptional()
  name?: string;

  @Expose()
  @IsString()
  @IsOptional()
  description?: string;

  @Expose()
  @IsString()
  @IsOptional()
  leaderId?: string;
}
