"use client";

import { FormEvent, useCallback, useEffect, useRef } from "react";

import { emptyManagementBootstrap } from "../_lib/constants";
import { apiRequest, clearApiCsrfToken, safeApiRequest, setApiCsrfToken } from "../_lib/api";
import {
  clearRefreshAuthStorage,
  clearLegacyRefreshLocalStorage,
  clearRefreshSessionStorage,
  getDefaultNavigation,
  getMenuConfig,
  parseRefreshNavigationState,
  refreshAccessTokenStorageKey,
  refreshAuthenticatedSessionStorageKey,
  refreshNavigationStorageKey,
  resolveNavigationForView,
  resolveStoredRefreshNavigation,
  serializeRefreshNavigationState,
  shouldRedirectAdminAfterLogin
} from "../_lib/utils";
import type { Content, EditorMeta, LoggedUser, ManagementBootstrap, Section } from "../_lib/types";
import type { useRefreshManagerState } from "./useRefreshManagerState";

type RefreshManagerState = ReturnType<typeof useRefreshManagerState>;
type BootstrapOptions = {
  isPostLogin?: boolean;
};
type RefreshManagerSessionOptions = {
  shouldBootstrapSession: boolean;
};
type BootstrapInput = BootstrapOptions | string | undefined;
type LoginResponse = {
  csrfToken?: string;
};
type SwitchProfileResponse = {
  csrfToken?: string;
};

const authenticatedSessionState = "cookie-session";

export function useRefreshManagerSession(
  state: RefreshManagerState,
  options: RefreshManagerSessionOptions = { shouldBootstrapSession: true }
) {
  const initialBootstrapStartedRef = useRef(false);
  const postLoginRedirectPendingRef = useRef(false);
  const selectedProfileIdRef = useRef(state.selectedProfileId);
  const viewRef = useRef(state.view);
  const {
    identifier,
    password,
    selectedProfileId,
    setContentForm,
    setContents,
    setError,
    setSessionAlert,
    setExpandedTopMenu,
    setIsSessionInitializing,
    setManagement,
    setMeta,
    setProfileMenuOpen,
    setSections,
    setSelectedProfileId,
    setSuccess,
    setToken,
    setTopMenu,
    setUser,
    setView,
    startTransition,
    topMenu,
    token,
    user,
    view
  } = state;

  useEffect(() => {
    selectedProfileIdRef.current = selectedProfileId;
  }, [selectedProfileId]);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const bootstrap = useCallback(
    async (input?: BootstrapInput, nextOptions: BootstrapOptions = {}) => {
      const options = typeof input === "string" ? nextOptions : input ?? {};

      try {
        setError("");

        const profile = await apiRequest<LoggedUser>("/auth/me");

        if (profile.csrfToken) {
          setApiCsrfToken(profile.csrfToken);
        }

        const firstProfileId = profile.activeRoleId ?? profile.roles[0]?.id ?? "";
        const activeProfile = profile.roles.find((role) => role.id === firstProfileId) ?? profile.roles[0] ?? null;
        const initialMenuConfig = getMenuConfig(activeProfile);
        const defaultNavigation = getDefaultNavigation(activeProfile, initialMenuConfig);
        const restoredNavigation = resolveStoredRefreshNavigation(
          parseRefreshNavigationState(window.sessionStorage.getItem(refreshNavigationStorageKey)),
          firstProfileId,
          initialMenuConfig
        );
        const currentView = viewRef.current;
        const currentSelectedProfileId = selectedProfileIdRef.current;
        const currentNavigation = resolveNavigationForView(currentView, initialMenuConfig);
        const usersNavigation = resolveNavigationForView("users", initialMenuConfig);
        const shouldApplyAdminPostLoginRedirect = shouldRedirectAdminAfterLogin({
          isAuthenticated: true,
          isLoadingSession: false,
          isPostLogin: Boolean(options.isPostLogin),
          user: profile,
          currentView
        });

        setUser(profile);
        setToken(authenticatedSessionState);
        window.sessionStorage.setItem(refreshAuthenticatedSessionStorageKey, "true");
        setSelectedProfileId(firstProfileId);
        setProfileMenuOpen(false);

        const shouldResetShell = currentSelectedProfileId !== firstProfileId || !currentSelectedProfileId;
        const nextNavigation = shouldApplyAdminPostLoginRedirect
          ? usersNavigation ?? defaultNavigation
          : shouldResetShell
            ? restoredNavigation ?? defaultNavigation
            : currentNavigation ?? restoredNavigation ?? defaultNavigation;

        if (shouldApplyAdminPostLoginRedirect || shouldResetShell || !currentNavigation) {
          setTopMenu(nextNavigation.topMenu);
          setView(nextNavigation.view);
        }

        setExpandedTopMenu(null);
        setIsSessionInitializing(false);

        const [nextMeta, nextSections, nextContents, nextManagement] = await Promise.all([
          safeApiRequest<EditorMeta>("/contents/meta", { templates: [], sections: [], contentTypes: [] }),
          safeApiRequest<Section[]>("/sections/admin/list", []),
          safeApiRequest<Content[]>("/contents/admin/list", []),
          safeApiRequest<ManagementBootstrap>("/management/bootstrap", emptyManagementBootstrap)
        ]);

        setMeta(nextMeta);
        setSections(nextSections);
        setContents(nextContents);
        setManagement(nextManagement);
        setContentForm((current) => ({
          ...current,
          sectionId: current.sectionId || nextMeta.sections[0]?.id || "",
          contentTypeId: current.contentTypeId || nextMeta.contentTypes[0]?.id || "",
          templateId: current.templateId || nextMeta.templates[0]?.id || ""
        }));
      } catch (bootstrapError) {
        if (
          bootstrapError instanceof Error &&
          "status" in bootstrapError &&
          [401, 403].includes((bootstrapError as Error & { status?: number }).status ?? 0)
        ) {
          const hadAuthenticatedSession =
            window.sessionStorage.getItem(refreshAuthenticatedSessionStorageKey) === "true";

          clearRefreshSessionStorage(window.sessionStorage);
          clearLegacyRefreshLocalStorage(window.localStorage);
          clearApiCsrfToken();

          setToken("");
          setUser(null);
          setError("");
          setIsSessionInitializing(false);
          setProfileMenuOpen(false);
          setExpandedTopMenu(null);

          if (hadAuthenticatedSession) {
            setSessionAlert({
              title: "Sessão expirada",
              message: "Sua sessão expirou. Faça login novamente para continuar."
            });
          }

          return;
        }

        setIsSessionInitializing(false);
        setError(bootstrapError instanceof Error ? bootstrapError.message : "Falha ao carregar o ambiente do manager.");
      }
    },
    [
      setContentForm,
      setContents,
      setError,
      setSessionAlert,
      setExpandedTopMenu,
      setIsSessionInitializing,
      setManagement,
      setMeta,
      setProfileMenuOpen,
      setSections,
      setSelectedProfileId,
      setToken,
      setTopMenu,
      setUser,
      setView
    ]
  );

  useEffect(() => {
    if (!options.shouldBootstrapSession) {
      setIsSessionInitializing(false);
      return;
    }

    if (initialBootstrapStartedRef.current) {
      return;
    }

    initialBootstrapStartedRef.current = true;
    clearLegacyRefreshLocalStorage(window.localStorage);
    window.sessionStorage.removeItem(refreshAccessTokenStorageKey);
    startTransition(() => {
      void bootstrap();
    });
  }, [bootstrap, options.shouldBootstrapSession, setIsSessionInitializing, startTransition]);

  useEffect(() => {
    if (!user || !selectedProfileId) {
      return;
    }

    const activeProfile = user.roles.find((role) => role.id === selectedProfileId) ?? null;
    const navigation = resolveNavigationForView(view, getMenuConfig(activeProfile));

    if (!navigation) {
      return;
    }

    window.sessionStorage.setItem(
      refreshNavigationStorageKey,
      serializeRefreshNavigationState({
        profileId: selectedProfileId,
        topMenu: navigation.topMenu,
        view: navigation.view
      })
    );
  }, [selectedProfileId, topMenu, user, view]);

  useEffect(() => {
    if (!user?.roles.length) {
      return;
    }

    const selectedStillExists = user.roles.some((role) => role.id === selectedProfileId);

    if (!selectedStillExists) {
      const fallbackProfile = user.roles[0];
      const fallbackMenuConfig = getMenuConfig(fallbackProfile ?? null);
      const defaultNavigation = getDefaultNavigation(fallbackProfile ?? null, fallbackMenuConfig);

      setSelectedProfileId(fallbackProfile?.id ?? "");
      setTopMenu(defaultNavigation.topMenu);
      setView(defaultNavigation.view);
    }
  }, [selectedProfileId, setSelectedProfileId, setTopMenu, setView, user]);

  const handleLogin = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password })
      });

      clearLegacyRefreshLocalStorage(window.localStorage);
      clearRefreshAuthStorage(window.sessionStorage);
      setApiCsrfToken(response.csrfToken);

      postLoginRedirectPendingRef.current = true;
      setIsSessionInitializing(true);
      setProfileMenuOpen(false);
      setExpandedTopMenu(null);
      setSessionAlert(null);
      await bootstrap({ isPostLogin: true });
      postLoginRedirectPendingRef.current = false;
      // setSuccess("Login realizado com sucesso.");
    } catch (loginError) {
      postLoginRedirectPendingRef.current = false;
      setIsSessionInitializing(false);
      setError(loginError instanceof Error ? loginError.message : "Falha ao autenticar.");
    }
  }, [
    identifier,
    password,
    setError,
    setExpandedTopMenu,
    setIsSessionInitializing,
    setProfileMenuOpen,
    setSessionAlert,
    setSuccess,
    bootstrap
  ]);

  const handleLogout = useCallback(() => {
    void apiRequest("/auth/logout", { method: "POST" }).finally(() => {
      clearRefreshSessionStorage(window.sessionStorage);
      clearLegacyRefreshLocalStorage(window.localStorage);
      clearApiCsrfToken();
      postLoginRedirectPendingRef.current = false;

      setToken("");
      setUser(null);
      setIsSessionInitializing(false);
      setSessionAlert(null);
      setSuccess("");
      setError("");
      setProfileMenuOpen(false);
      setExpandedTopMenu(null);
    });
  }, [
    setError,
    setExpandedTopMenu,
    setIsSessionInitializing,
    setProfileMenuOpen,
    setSessionAlert,
    setSuccess,
    setToken,
    setUser
  ]);

  const switchProfile = useCallback(async (profileId: string) => {
    const nextProfile = user?.roles.find((role) => role.id === profileId);

    if (!nextProfile) {
      return;
    }

    try {
      const nextMenuConfig = getMenuConfig(nextProfile);
      const nextNavigation = getDefaultNavigation(nextProfile, nextMenuConfig);

      const response = await apiRequest<SwitchProfileResponse>(
        "/auth/switch-profile",
        {
          method: "POST",
          body: JSON.stringify({ roleId: profileId })
        },
        token
      );

      clearLegacyRefreshLocalStorage(window.localStorage);
      setApiCsrfToken(response.csrfToken);
      setToken(authenticatedSessionState);
      setSelectedProfileId(profileId);
      setTopMenu(nextNavigation.topMenu);
      setView(nextNavigation.view);
      setProfileMenuOpen(false);
      setExpandedTopMenu(null);
      setSuccess(`Perfil ativo: ${nextProfile.name}`);
    } catch (switchError) {
      setError(switchError instanceof Error ? switchError.message : "Falha ao trocar o perfil.");
    }
  }, [
    setError,
    setExpandedTopMenu,
    setProfileMenuOpen,
    setSelectedProfileId,
    setSuccess,
    setToken,
    setTopMenu,
    setView,
    token,
    user
  ]);

  return {
    bootstrap,
    handleLogin,
    handleLogout,
    switchProfile
  };
}
