"use client";

import { RefreshLogin } from "./_components/RefreshLogin";
import { RefreshModules } from "./_components/RefreshModules";
import { RefreshShell } from "./_components/RefreshShell";
import type { PasswordRecoveryModalMode } from "./_components/PasswordRecoveryModals";
import { roleName } from "./_lib/utils";
import { useRefreshManager } from "./_hooks/useRefreshManager";

type RefreshPageClientProps = {
  recoveryModalMode?: PasswordRecoveryModalMode | null;
  resetToken?: string;
};

export default function RefreshPageClient({ recoveryModalMode = null, resetToken }: RefreshPageClientProps) {
  const manager = useRefreshManager();

  if (recoveryModalMode || !manager.token || !manager.user) {
    return (
      <RefreshLogin
        error={manager.error}
        identifier={manager.identifier}
        onIdentifierChange={manager.setIdentifier}
        onPasswordChange={manager.setPassword}
        onSubmit={manager.handleLogin}
        password={manager.password}
        recoveryModalMode={recoveryModalMode}
        resetToken={resetToken}
        sessionAlert={manager.sessionAlert}
        success={manager.success}
      />
    );
  }

  return (
    <RefreshShell
      error={manager.error}
      expandedTopMenu={manager.expandedTopMenu}
      isPending={manager.isPending}
      menuGroups={manager.activeMenuConfig.groups}
      onCloseProfileMenu={() => manager.setProfileMenuOpen(false)}
      onCloseTopMenu={() => manager.setExpandedTopMenu(null)}
      onLogout={() => {
        manager.setProfileMenuOpen(false);
        manager.setExpandedTopMenu(null);
        manager.handleLogout();
      }}
      onSelectView={(nextTopMenu, nextView) => {
        manager.setProfileMenuOpen(false);
        manager.setTopMenu(nextTopMenu);
        manager.setView(nextView);
        manager.setExpandedTopMenu(null);
      }}
      onSwitchProfile={(profileId) => {
        manager.setProfileMenuOpen(false);
        void manager.switchProfile(profileId);
      }}
      onToggleProfileMenu={() => {
        manager.setExpandedTopMenu(null);
        manager.setProfileMenuOpen((current) => !current);
      }}
      onToggleTopMenu={(menuKey) => {
        manager.setProfileMenuOpen(false);
        manager.setTopMenu(menuKey);
        manager.setExpandedTopMenu((current) => (current === menuKey ? null : menuKey));
      }}
      profileMenuOpen={manager.profileMenuOpen}
      roleLabel={roleName(manager.activeProfile)}
      selectedProfileId={manager.selectedProfileId}
      success={manager.success}
      topMenu={manager.topMenu}
      topMenus={manager.topMenus}
      user={manager.user}
      view={manager.view}
    >
      <RefreshModules manager={manager} />
    </RefreshShell>
  );
}
