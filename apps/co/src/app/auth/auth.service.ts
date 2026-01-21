import {
  comparePassword,
  JwtPayload,
  LoginRequestDto,
  LoginResponseDto,
  UpdateProfileDto,
  UserDto,
  UserStatus,
} from '@class-operation/libs';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async login(loginRequestDto: LoginRequestDto): Promise<LoginResponseDto> {
    const { email, password } = loginRequestDto;
    const user = await this.userService.findByEmail(email.toLocaleLowerCase());
    if (!user) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new ForbiddenException('Your account is blocked');
    }
    const isMatch = comparePassword(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    user.lastLogin = new Date();

    await this.userService.store(user);

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      user: UserDto.plainToInstance(user),
      accessToken,
    };
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
    avatar?: Express.Multer.File,
  ) {
    const user = await this.userService.findById(userId, {
      relations: ['role', 'detail'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Process avatar upload if provided
    let avatarUrl = user.avatar;
    if (avatar) {
      // Upload to cloudinary
      const uploadOptions = {
        folder: 'user-avatars',
        allowed_formats: ['jpg', 'png'],
      };
      const uploadResult = await this.cloudinaryService.uploadFile(
        avatar,
        uploadOptions,
      );
      avatarUrl = uploadResult.secure_url;
    }

    // Save the updated user
    const updatedUser = await this.userService.store({
      ...user,
      firstName: updateProfileDto.firstName,
      lastName: updateProfileDto.lastName,
      phoneNumber: updateProfileDto.phoneNumber,
      avatar: avatarUrl,
    });
    return updatedUser;
  }
}
