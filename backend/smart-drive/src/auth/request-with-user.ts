import { Request } from 'express';

/**
 * Contrato esperado de `request.user` após a autenticação.
 * O guard real usa token Bearer assinado, mas preserva este shape para não
 * obrigar controllers existentes a mudarem.
 */
export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}
