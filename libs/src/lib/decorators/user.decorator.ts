import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUser, UserDecoratorParam } from '../types/common.type';

export const User = createParamDecorator(
  (data: UserDecoratorParam, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    if (data === 'role') return request.role;
    if (data) return request.user?.[data];
    return request.user;
  },
);
