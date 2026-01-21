import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class CreateFieldDto {
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

  @Expose()
  @IsString()
  @IsOptional()
  leaderId?: string;
}
