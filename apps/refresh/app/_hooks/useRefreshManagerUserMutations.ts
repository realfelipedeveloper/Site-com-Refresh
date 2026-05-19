"use client";

import type { FormEvent } from "react";

import { emptyUserForm } from "../_lib/constants";
import { apiRequest, clearApiCsrfToken } from "../_lib/api";
import {
  buildDuplicateUserMessage,
  clearLegacyRefreshLocalStorage,
  clearRefreshSessionStorage,
  normalizeIdentityValue
} from "../_lib/utils";
import type { ManagedUser } from "../_lib/types";
import type { useRefreshManagerSession } from "./useRefreshManagerSession";
import type { useRefreshManagerState } from "./useRefreshManagerState";

type RefreshManagerState = ReturnType<typeof useRefreshManagerState>;
type RefreshManagerSession = ReturnType<typeof useRefreshManagerSession>;

export function useRefreshManagerUserMutations(state: RefreshManagerState, session: RefreshManagerSession) {
  function isAuthenticationError(error: unknown) {
    return (
      error instanceof Error &&
      "status" in error &&
      [401, 403].includes((error as Error & { status?: number }).status ?? 0)
    );
  }

  function expireSession() {
    clearRefreshSessionStorage(window.sessionStorage);
    clearLegacyRefreshLocalStorage(window.localStorage);
    clearApiCsrfToken();

    state.setToken("");
    state.setUser(null);
    state.setError("");
    state.setSuccess("");
    state.setSessionAlert({
      title: "Sessão expirada",
      message: "Faça login novamente para continuar."
    });
  }

  async function handleUserSubmit(event: FormEvent<HTMLFormElement>, profileTempImage?: File | null) {
    event.preventDefault();
    state.setError("");
    state.setSuccess("");

    try {
      const trimmedName = state.userForm.name.trim();
      const trimmedEmail = state.userForm.email.trim();
      const trimmedUsername = state.userForm.username.trim();
      const shouldValidatePassword =
        !state.userForm.id || Boolean(state.userForm.password) || Boolean(state.userForm.passwordConfirmation);

      if (!trimmedName) {
        state.setError("Você precisa informar o nome.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return false;
      }

      if (!trimmedEmail) {
        state.setError("Você precisa informar o e-mail.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return false;
      }

      if (!trimmedUsername) {
        state.setError("Você precisa informar o username.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return false;
      }

      if (shouldValidatePassword) {
        if (!state.userForm.password) {
          state.setError("Você precisa informar a senha.");
          window.scrollTo({ top: 0, behavior: "smooth" });
          return false;
        }

        if (state.userForm.password !== state.userForm.passwordConfirmation) {
          state.setError("Senha informada não confere.");
          window.scrollTo({ top: 0, behavior: "smooth" });
          return false;
        }

        if (state.userForm.password.length < 6) {
          state.setError("A senha deve ter no mínimo seis caracteres.");
          window.scrollTo({ top: 0, behavior: "smooth" });
          return false;
        }
      }

      const normalizedEmail = normalizeIdentityValue(trimmedEmail);
      const normalizedUsername = normalizeIdentityValue(trimmedUsername);
      const normalizedCpf = state.userForm.cpf.replace(/\D/g, "");
      const conflictingUser = state.management.users.find((managedUser) => {
        if (state.userForm.id && managedUser.id === state.userForm.id) {
          return false;
        }

        const managedEmail = normalizeIdentityValue(managedUser.email);
        const managedUsername = normalizeIdentityValue(managedUser.username ?? "");
        const managedCpf = (managedUser.cpf ?? "").replace(/\D/g, "");

        return (
          (normalizedEmail && managedEmail === normalizedEmail) ||
          (normalizedUsername && managedUsername === normalizedUsername) ||
          (normalizedCpf && managedCpf === normalizedCpf)
        );
      });

      if (conflictingUser) {
        handleConflictingUser(conflictingUser, normalizedUsername, normalizedCpf);
        return false;
      }

      const path = state.userForm.id ? `/management/users/${state.userForm.id}` : "/management/users";
      const method = state.userForm.id ? "PATCH" : "POST";
      const formData = new FormData();

      formData.append("name", trimmedName);
      formData.append("email", trimmedEmail);
      formData.append("username", trimmedUsername);

      if (state.userForm.cpf) formData.append("cpf", state.userForm.cpf);
      if (state.userForm.cnh) formData.append("cnh", state.userForm.cnh);

      formData.append("status", state.userForm.status);

      if (state.userForm.company) formData.append("company", state.userForm.company);
      if (state.userForm.jobTitle) formData.append("jobTitle", state.userForm.jobTitle);
      if (state.userForm.phone) formData.append("phone", state.userForm.phone);
      if (state.userForm.address) formData.append("address", state.userForm.address);
      if (state.userForm.zipCode) formData.append("zipCode", state.userForm.zipCode);
      if (state.userForm.city) formData.append("city", state.userForm.city);
      if (state.userForm.state) formData.append("state", state.userForm.state);

      if (state.userForm.secondaryAddress) formData.append("secondaryAddress", state.userForm.secondaryAddress);
      if (state.userForm.secondaryNumber) formData.append("secondaryNumber", state.userForm.secondaryNumber);
      if (state.userForm.secondaryComplement) formData.append("secondaryComplement", state.userForm.secondaryComplement);
      if (state.userForm.neighborhood) formData.append("neighborhood", state.userForm.neighborhood);

      if (state.userForm.notes) formData.append("notes", state.userForm.notes);

      if (state.userForm.facebook) formData.append("facebook", state.userForm.facebook);
      if (state.userForm.instagram) formData.append("instagram", state.userForm.instagram);
      if (state.userForm.youtube) formData.append("youtube", state.userForm.youtube);

      formData.append("forcePasswordChange", String(state.userForm.forcePasswordChange));
      formData.append("isActive", String(state.userForm.isActive));
      formData.append("isSuperAdmin", String(state.userForm.isSuperAdmin));

      if (state.userForm.password) {
        formData.append("password", state.userForm.password);
      }

      state.userForm.roleIds.forEach((id) => {
        formData.append("roleIds[]", id);
      });

      if (profileTempImage) {
        formData.append("file", profileTempImage);
      }

      const savedUser = await apiRequest<ManagedUser>(
        path,
        {
          method,
          body: formData
        },
        state.token
      );

      state.setHighlightedUserId(savedUser.id);
      state.setUserForm(emptyUserForm);
      state.setSelectedUserIds([]);
      await session.bootstrap(state.token);
      state.setSuccess(state.userForm.id ? "Usuário atualizado com sucesso." : "Usuário criado com sucesso.");
      return true;
    } catch (submitError) {
      if (isAuthenticationError(submitError)) {
        expireSession();
        return false;
      }

      state.setError(submitError instanceof Error ? submitError.message : "Falha ao salvar usuário.");
      return false;
    }
  }

  function handleConflictingUser(conflictingUser: ManagedUser, normalizedUsername: string, normalizedCpf: string) {
    if (normalizedUsername && normalizeIdentityValue(conflictingUser.username ?? "") === normalizedUsername) {
      state.setHighlightedUserId(conflictingUser.id);
      state.setError(buildDuplicateUserMessage(conflictingUser, "username", state.userForm.username));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (normalizedCpf && (conflictingUser.cpf ?? "").replace(/\D/g, "") === normalizedCpf) {
      state.setHighlightedUserId(conflictingUser.id);
      state.setError(buildDuplicateUserMessage(conflictingUser, "cpf", state.userForm.cpf));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    state.setHighlightedUserId(conflictingUser.id);
    state.setError(buildDuplicateUserMessage(conflictingUser, "email", state.userForm.email));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeUsers(userIds: string[]) {
    state.setError("");
    state.setSuccess("");

    if (userIds.length === 0) {
      state.setError("Selecione pelo menos um usuário para excluir.");
      return;
    }

    try {
      await Promise.all(
        userIds.map((userId) => apiRequest(`/management/users/${userId}`, { method: "DELETE" }, state.token))
      );
      state.setSelectedUserIds([]);
      if (userIds.includes(state.highlightedUserId)) {
        state.setHighlightedUserId("");
      }
      await session.bootstrap(state.token);
      state.setSuccess(userIds.length === 1 ? "Usuário excluído com sucesso." : "Usuários excluídos com sucesso.");
    } catch (removeError) {
      state.setError(removeError instanceof Error ? removeError.message : "Falha ao excluir usuários.");
    }
  }

  return {
    handleUserSubmit,
    removeUsers
  };
}
