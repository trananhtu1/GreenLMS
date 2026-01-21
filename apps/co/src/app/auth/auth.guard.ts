import {
  IS_PUBLIC_KEY,
  JwtPayload,
  RequestWithUser,
  RoleName,
  ROLES_KEY,
  UserStatus,
} from '@class-operation/libs';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return (
      (await this.isPublicRoute(context)) ||
      ((await this.isTokenValid(context)) &&
        (await this.isUserHasRequiredRoles(context)))
    );
  }

  private async isPublicRoute(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    return isPublic || false;
  }

  private async isTokenValid(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      request.user = payload;

      return true;
    } catch (error: any) {
      switch (error.name) {
        case 'TokenExpiredError':
          throw new UnauthorizedException('Token expired');

        default:
          throw new UnauthorizedException('Invalid token');
      }
    }
  }

  private async isUserHasRequiredRoles(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const payload = request.user;
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!payload) {
      throw new UnauthorizedException('User information not found in token');
    }

    return (
      !requiredRoles ||
      (await this.isUserInRequiredRoles(payload, requiredRoles, request))
    );
  }

  private async isUserInRequiredRoles(
    payload: JwtPayload,
    requiredRoles: RoleName[],
    request: RequestWithUser,
  ): Promise<boolean> {
    const user = await this.userService.findById(payload.userId, {
      relations: ['role'],
    });
    if (user.status === UserStatus.BLOCKED) {
      throw new ForbiddenException('Your account is blocked');
    }

    const roleName = user.role?.roleName;

    request.role = roleName;

    return requiredRoles?.includes(roleName);
  }

  private extractTokenFromHeader(request: RequestWithUser): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
