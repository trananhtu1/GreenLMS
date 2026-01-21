import { Expose } from 'class-transformer';
import { BaseDto } from '../common/base.dto';

export class DepartmentDto extends BaseDto {
  @Expose()
  code: string;

  @Expose()
  name: string;

  @Expose()
  description: string;
}
