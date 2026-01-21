import {
  LoginRequestDto,
  Public,
  ResponseDto,
  UpdateProfileDto,
  User,
  UserDto,
} from '@class-operation/libs';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('/login')
  @Public()
  async login(@Body() loginRequestDto: LoginRequestDto) {
    const loginResponseDto = await this.authService.login(loginRequestDto);

    return new ResponseDto(
      HttpStatus.OK,
      'Đăng nhập thành công',
      loginResponseDto,
    );
  }

  @Get('/my-profile')
  async getProfile(@User('userId') userId: string) {
    const user = await this.userService.findById(userId, {
      relations: ['role', 'detail', 'detail.department', 'detail.field'],
    });

    return new ResponseDto(
      HttpStatus.OK,
      'Success',
      UserDto.plainToInstance(user),
    );
  }

  @Patch('/update-profile')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateProfile(
    @User('userId') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    const updatedUser = await this.authService.updateProfile(
      userId,
      updateProfileDto,
      avatar,
    );

    return new ResponseDto(
      HttpStatus.OK,
      'Profile updated successfully',
      UserDto.plainToInstance(updatedUser),
    );
  }
}
