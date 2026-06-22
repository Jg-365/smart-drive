import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RequestWithUser } from './request-with-user';
import { SignedTokenService } from './signed-token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly signedTokenService: SignedTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authorization = request.headers.authorization;

    if (authorization?.startsWith('Bearer ')) {
      const token = authorization.slice('Bearer '.length).trim();
      const payload = this.signedTokenService.verify(token);
      request.user = { id: payload.sub, email: payload.email };
      return true;
    }

    // Compatibilidade para desenvolvimento local enquanto o frontend ainda não
    // estiver enviando Bearer token. Em produção, defina ALLOW_X_USER_ID_AUTH=false.
    const allowDevHeader = process.env.ALLOW_X_USER_ID_AUTH !== 'false';
    const userId = request.headers['x-user-id'];
    if (allowDevHeader && typeof userId === 'string' && userId.trim()) {
      request.user = { id: userId.trim() };
      return true;
    }

    throw new UnauthorizedException('Token Bearer é obrigatório.');
  }
}
