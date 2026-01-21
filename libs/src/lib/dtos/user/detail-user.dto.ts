import { Expose, Type } from 'class-transformer';
import { TeacherLevel } from '../../enums';
import { BaseDto } from '../common/base.dto';
import { DepartmentDto } from '../department/department.dto';
import { FieldDto } from '../field/field.dto';

export class DetailUserDto extends BaseDto {
  @Expose()
  code: string;

  @Expose()
  teacherLevel: TeacherLevel;

  fieldId: string;

  @Expose()
  @Type(() => FieldDto)
  field: FieldDto;

  departmentId: string;

  @Expose()
  @Type(() => DepartmentDto)
  department: DepartmentDto[];
}
