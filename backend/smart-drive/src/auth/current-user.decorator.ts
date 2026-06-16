import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser, RequestWithUser } from './request-with-user';

/**
 * Extrai `request.user` (populado pelo [[TempUserGuard]] hoje, e pelo guard
 * JWT real do Pedro futuramente).
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
