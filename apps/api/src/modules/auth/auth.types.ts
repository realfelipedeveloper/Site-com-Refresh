export type AuthenticatedUser = {
  sub: string;
  sessionId?: string;
  email: string;
  username?: string | null;
  cpf?: string | null;
  picture?: string | null;
  permissions: string[];
  roleId?: string;
};
