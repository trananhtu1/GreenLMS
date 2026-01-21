import { Expose, Type } from 'class-transformer';
import { UserStatus } from '../../enums';
import { BaseDto } from '../common/base.dto';
import { CourseDto } from '../course/course.dto';
import { RoomDto } from '../room/room.dto';
import { UserDto } from '../user/user.dto';

export class StudentClassesDto extends BaseDto {
  @Expose()
  studentId: string;

  @Expose()
  @Type(() => UserDto)
  student: UserDto;

  @Expose()
  status: UserStatus;
}

export class ClassDto extends BaseDto {
  @Expose()
  code: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  startDate: Date;

  @Expose()
  endDate: Date;

  @Expose()
  quantity: number;

  @Expose()
  status: UserStatus;

  @Expose()
  courseId: string;

  @Expose()
  @Type(() => CourseDto)
  course: CourseDto;

  @Expose()
  teacherId: string;

  @Expose()
  @Type(() => UserDto)
  teacher: UserDto;

  @Expose()
  roomId: string;

  @Expose()
  @Type(() => RoomDto)
  room: RoomDto;

  @Expose()
  @Type(() => StudentClassesDto)
  studentClasses: StudentClassesDto[];
}
