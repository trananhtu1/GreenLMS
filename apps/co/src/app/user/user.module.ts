import { UserEntity } from '@class-operation/libs';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CounterModule } from '../counter/counter.module';
import { DepartmentModule } from '../department/department.module';
import { FieldModule } from '../field/field.module';
import { RoleModule } from '../role/role.module';
import { UserDetailModule } from '../user-detail/user-detail.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    RoleModule,
    CounterModule,
    UserDetailModule,
    FieldModule,
    DepartmentModule,
    CloudinaryModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
