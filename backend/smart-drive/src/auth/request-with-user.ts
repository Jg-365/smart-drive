import { Request } from 'express';

/**
 * Contrato esperado de `request.user` após a autenticação — preenchido hoje
 * pelo [[TempUserGuard]] (placeholder) e, futuramente, pelo guard JWT real do
 * Pedro (PED-RF-02). Mantendo este shape, controllers não precisam mudar.
 */
export interface AuthenticatedUser {
  id: string;
}

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}
