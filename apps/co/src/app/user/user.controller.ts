import {
  CreateUserDto,
  Pagination,
  ResponseDto,
  RoleName,
  Roles,
  UpdateUserDto,
  UserDto,
  UserStatus,
} from '@class-operation/libs';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/teachers')
  @Roles(
    RoleName.ADMIN,
    RoleName.MANAGE,
    RoleName.STAFF_GENERAL,
    RoleName.STAFF_ACADEMIC,
    RoleName.RECEPTIONIST,
  )
  async findTeachers(@Query() query: Record<string, any>) {
    const { page, limit, total, data } =
      await this.userService.findUsersByRoleName(
        [RoleName.TEACHER_FULL_TIME, RoleName.TEACHER_PART_TIME],
        query,
      );

    const results: Pagination<UserDto> = {
      page,
      limit,
      total,
      items: UserDto.plainToInstance(data, ['admin']),
    };

    return new ResponseDto(HttpStatus.OK, 'Success', results);
  }

  @Get('/staffs')
  @Roles(RoleName.ADMIN, RoleName.STAFF_GENERAL)
  async findStaffs(@Query() query: Record<string, any>) {
    const { page, limit, total, data } =
      await this.userService.findUsersByRoleName(
        [
          RoleName.STAFF_ACADEMIC,
          RoleName.STAFF_GENERAL,
          RoleName.RECEPTIONIST,
        ],
        query,
      );

    const results: Pagination<UserDto> = {
      page,
      limit,
      total,
      items: UserDto.plainToInstance(data, ['admin']),
    };

    return new ResponseDto(HttpStatus.OK, 'Success', results);
  }

  @Get('/managers')
  @Roles(RoleName.ADMIN, RoleName.STAFF_GENERAL)
  async findManagers(@Query() query: Record<string, any>) {
    const { page, limit, total, data } =
      await this.userService.findUsersByRoleName(
        [RoleName.ADMIN, RoleName.MANAGE],
        query,
      );

    const results: Pagination<UserDto> = {
      page,
      limit,
      total,
      items: UserDto.plainToInstance(data, ['admin']),
    };

    return new ResponseDto(HttpStatus.OK, 'Success', results);
  }

  @Get('/students')
  @Roles(RoleName.ADMIN, RoleName.STAFF_GENERAL, RoleName.STAFF_ACADEMIC)
  async findStudents(@Query() query: Record<string, any>) {
    const { page, limit, total, data } =
      await this.userService.findUsersByRoleName([RoleName.STUDENT], query);

    const results: Pagination<UserDto> = {
      page,
      limit,
      total,
      items: UserDto.plainToInstance(data, ['admin']),
    };

    return new ResponseDto(HttpStatus.OK, 'Success', results);
  }

  @Post('/')
  @Roles(RoleName.ADMIN, RoleName.STAFF_GENERAL)
  @UseInterceptors(FileInterceptor('avatar'))
  async createUser(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    const user = await this.userService.create(createUserDto, avatar);

    return new ResponseDto(
      HttpStatus.CREATED,
      'User created successfully',
      UserDto.plainToInstance(user, ['admin']),
    );
  }

  @Get('/:id')
  @Roles(RoleName.ADMIN, RoleName.STAFF_GENERAL)
  async findById(@Param('id') id: string) {
    const user = await this.userService.findById(id, {
      relations: ['role', 'detail', 'detail.department', 'detail.field'],
    });

    return new ResponseDto(
      HttpStatus.OK,
      'User retrieved successfully',
      UserDto.plainToInstance(user, ['admin']),
    );
  }

  @Put('/:id')
  @Roles(RoleName.ADMIN, RoleName.STAFF_GENERAL)
  @UseInterceptors(FileInterceptor('avatar'))
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    const user = await this.userService.updateById(id, updateUserDto, avatar);

    return new ResponseDto(
      HttpStatus.OK,
      'User updated successfully',
      UserDto.plainToInstance(user, ['admin']),
    );
  }

  @Patch('/:id/update-status')
  @Roles(RoleName.ADMIN, RoleName.STAFF_GENERAL)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: UserStatus,
  ) {
    const user = await this.userService.updateUserStatus(id, status);

    return new ResponseDto(
      HttpStatus.OK,
      `User ${status === UserStatus.ACTIVE ? 'unlocked' : 'locked'} successfully`,
      UserDto.plainToInstance(user, ['admin']),
    );
  }
}
