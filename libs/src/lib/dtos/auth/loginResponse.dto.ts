import { UserDto } from '../user/user.dto';

export class LoginResponseDto {
  user: UserDto;
  accessToken: string;
}
