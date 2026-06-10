import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RequestWithUser } from './request-with-user';

/**
 * GUARD TEMPORÁRIO — substituir pelo guard JWT real do Pedro (PED-RF-02) assim
 * que estiver disponível, sem alterar os controllers: o contrato
 * `request.user = { id: string }` deve ser preservado.
 *
 * Por enquanto, identifica o usuário autenticado a partir do header
 * `x-user-id`, o que permite testar o VehiclesModule via curl/Insomnia
 * enquanto a autenticação real não existe.
 */
@Injectable()
export class TempUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request.headers['x-user-id'];

    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException(
        'Header x-user-id é obrigatório (auth placeholder).',
      );
    }

    request.user = { id: userId };
    return true;
  }
}
