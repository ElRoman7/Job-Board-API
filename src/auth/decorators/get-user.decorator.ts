import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from '../../users/entities/user.entity';


export const GetUser = createParamDecorator((data, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  const user: User = req.user;
  if (!user) throw new InternalServerErrorException('User not found (request)');

  return !data ? user : user[data];
});
