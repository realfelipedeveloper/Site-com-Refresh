export type AuthenticatedUser = {
  sub: string;
  email: string;
  username?: string | null;
  cpf?: string | null;
  permissions: string[];
  roleId?: string;
};
