import { describe, expect, it } from "vitest";

import { validateRecoveryEmail, validateResetPassword } from "./passwordRecovery";

describe("password recovery validation", () => {
  it("validates recovery e-mail input", () => {
    expect(validateRecoveryEmail("")).toBe("Informe o e-mail da conta.");
    expect(validateRecoveryEmail("usuario")).toBe("Informe um e-mail válido.");
    expect(validateRecoveryEmail(" usuario@exemplo.com ")).toBe("");
  });

  it("validates reset password input", () => {
    expect(validateResetPassword("", "")).toBe("Informe e confirme a nova senha.");
    expect(validateResetPassword("curta1", "curta1")).toBe("A senha deve ter pelo menos 8 caracteres.");
    expect(validateResetPassword("abcdefgh", "abcdefgh")).toBe("A senha deve combinar letras e números.");
    expect(validateResetPassword("Senha123", "Outra123")).toBe("As senhas informadas não conferem.");
    expect(validateResetPassword("Senha123", "Senha123")).toBe("");
  });
});
