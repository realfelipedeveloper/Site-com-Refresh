export const PASSWORD_RESET_GENERIC_MESSAGE =
  "Se os dados informados estiverem vinculados a uma conta ativa, enviaremos instruções para recuperação de acesso.";

export const PASSWORD_RESET_INVALID_LINK_MESSAGE =
  "Este link de recuperação é inválido ou expirou. Solicite uma nova recuperação de acesso.";

export const PASSWORD_RESET_SUCCESS_MESSAGE = "Senha redefinida com sucesso. Você já pode acessar sua conta.";

export const PASSWORD_RESET_FAILURE_MESSAGE = "Não foi possível concluir a solicitação agora. Tente novamente.";

export function validateRecoveryEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return "Informe o e-mail da conta.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return "Informe um e-mail válido.";
  }

  return "";
}

export function validateResetPassword(password: string, passwordConfirmation: string) {
  if (!password || !passwordConfirmation) {
    return "Informe e confirme a nova senha.";
  }

  if (password.length < 8) {
    return "A senha deve ter pelo menos 8 caracteres.";
  }

  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return "A senha deve combinar letras e números.";
  }

  if (password !== passwordConfirmation) {
    return "As senhas informadas não conferem.";
  }

  return "";
}
