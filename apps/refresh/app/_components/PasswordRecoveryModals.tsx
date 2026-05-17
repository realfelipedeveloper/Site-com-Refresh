"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ForgotPasswordResponse, ResetPasswordResponse } from "@abbatech/contracts";

import { apiRequest } from "../_lib/api";
import {
  PASSWORD_RESET_FAILURE_MESSAGE,
  PASSWORD_RESET_GENERIC_MESSAGE,
  PASSWORD_RESET_INVALID_LINK_MESSAGE,
  PASSWORD_RESET_SUCCESS_MESSAGE,
  validateRecoveryEmail,
  validateResetPassword
} from "../_lib/passwordRecovery";
import { ActionButton } from "./ActionButton";
import { AdminModal } from "./AdminModal";

export type PasswordRecoveryModalMode = "forgot-password" | "reset-password";

type PasswordRecoveryModalsProps = {
  mode: PasswordRecoveryModalMode | null;
  resetToken?: string;
};

export function PasswordRecoveryModals({ mode, resetToken }: PasswordRecoveryModalsProps) {
  const router = useRouter();

  const closeModal = () => {
    router.push("/");
  };

  return (
    <>
      <ForgotPasswordModal
        key={mode === "forgot-password" ? "forgot-password-open" : "forgot-password-closed"}
        isOpen={mode === "forgot-password"}
        onClose={closeModal}
      />

      <ResetPasswordModal
        key={resetToken ?? "missing-reset-token"}
        isOpen={mode === "reset-password"}
        onClose={closeModal}
        resetToken={resetToken}
      />
    </>
  );
}

function ForgotPasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleForgotPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateRecoveryEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest<ForgotPasswordResponse>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      setSuccess(response.message || PASSWORD_RESET_GENERIC_MESSAGE);
      setEmail("");
    } catch {
      setError(PASSWORD_RESET_FAILURE_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminModal
      description="Informe o e-mail vinculado ao seu usuário para receber as instruções."
      error={error}
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      success={success}
      title="Recuperar acesso"
    >
      <form className="admin-modal-form space-y-4" onSubmit={handleForgotPasswordSubmit}>
        <label className="block">
          <span className="admin-label">E-mail</span>
          <input
            autoComplete="email"
            className="admin-input"
            inputMode="email"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
          />
        </label>

        <p className="text-[13px] font-medium leading-6 text-[#58708a]">{PASSWORD_RESET_GENERIC_MESSAGE}</p>

        <div className="admin-modal-footer flex flex-wrap justify-end gap-2">
          <button className="admin-link" onClick={onClose} type="button">
            Voltar ao login
          </button>
          <ActionButton disabled={isSubmitting || Boolean(success)} tone="blue" type="submit">
            {isSubmitting ? "Enviando..." : "Enviar instruções"}
          </ActionButton>
        </div>
      </form>
    </AdminModal>
  );
}

function ResetPasswordModal({
  isOpen,
  onClose,
  resetToken
}: {
  isOpen: boolean;
  onClose: () => void;
  resetToken?: string;
}) {
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleResetPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!resetToken) {
      setError(PASSWORD_RESET_INVALID_LINK_MESSAGE);
      return;
    }

    const validationError = validateResetPassword(password, passwordConfirmation);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest<ResetPasswordResponse>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token: resetToken,
          password,
          passwordConfirmation
        })
      });

      setPassword("");
      setPasswordConfirmation("");
      setSuccess(PASSWORD_RESET_SUCCESS_MESSAGE);
    } catch (requestError) {
      if (requestError instanceof Error && requestError.message.includes("link de recuperação")) {
        setError(PASSWORD_RESET_INVALID_LINK_MESSAGE);
        return;
      }

      setError(requestError instanceof Error && requestError.message ? requestError.message : PASSWORD_RESET_FAILURE_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminModal
      description="Defina uma nova senha para acessar o Refresh."
      error={error}
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      success={success}
      title="Redefinir senha"
    >
      {resetToken ? (
        <form className="admin-modal-form space-y-4" onSubmit={handleResetPasswordSubmit}>
          <label className="block">
            <span className="admin-label">Nova senha</span>
            <input
              autoComplete="new-password"
              className="admin-input"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>

          <label className="block">
            <span className="admin-label">Confirmar nova senha</span>
            <input
              autoComplete="new-password"
              className="admin-input"
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              type="password"
              value={passwordConfirmation}
            />
          </label>

          <p className="text-[13px] font-medium leading-6 text-[#58708a]">
            Use pelo menos 8 caracteres, combinando letras e números.
          </p>

          <div className="admin-modal-footer flex flex-wrap justify-end gap-2">
            <button className="admin-link" onClick={onClose} type="button">
              Voltar ao login
            </button>
            <ActionButton disabled={isSubmitting || Boolean(success)} tone="blue" type="submit">
              {isSubmitting ? "Salvando..." : "Redefinir senha"}
            </ActionButton>
          </div>
        </form>
      ) : (
        <div className="admin-modal-form space-y-4">
          <p className="text-[13px] font-semibold leading-6 text-[#c0392b]">{PASSWORD_RESET_INVALID_LINK_MESSAGE}</p>
          <div className="admin-modal-footer flex justify-end">
            <button className="admin-link" onClick={onClose} type="button">
              Voltar ao login
            </button>
          </div>
        </div>
      )}
    </AdminModal>
  );
}
