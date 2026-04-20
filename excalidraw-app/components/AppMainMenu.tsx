import { MainMenu } from "@excalidraw/excalidraw/index";
import React from "react";

import type { Theme } from "@excalidraw/element/types";

import { LanguageList } from "../app-language/LanguageList";
import { signOut } from "../data/supabase";

export const AppMainMenu: React.FC<{
  onCollabDialogOpen: () => any;
  isCollaborating: boolean;
  isCollabEnabled: boolean;
  theme: Theme | "system";
  setTheme: (theme: Theme | "system") => void;
  refresh: () => void;
  onBackToDashboard: () => void;
  isGuest?: boolean;
}> = React.memo((props) => {
  const dashboardIcon = (
    <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );

  const signupIcon = (
    <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
      <line x1="19" y1="8" x2="19" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="16" y1="11" x2="22" y2="11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );

  return (
    <MainMenu>
      <MainMenu.Item
        icon={dashboardIcon}
        onSelect={props.onBackToDashboard}
      >
        {props.isGuest ? "← Volver al inicio" : "Mis dibujos"}
      </MainMenu.Item>
      <MainMenu.Separator />
      <MainMenu.DefaultItems.SaveToActiveFile />
      <MainMenu.DefaultItems.Export />
      <MainMenu.DefaultItems.SaveAsImage />
      {props.isCollabEnabled && (
        <MainMenu.DefaultItems.LiveCollaborationTrigger
          isCollaborating={props.isCollaborating}
          onSelect={() => props.onCollabDialogOpen()}
        />
      )}
      <MainMenu.DefaultItems.CommandPalette className="highlighted" />
      <MainMenu.DefaultItems.SearchMenu />
      <MainMenu.DefaultItems.Help />
      <MainMenu.DefaultItems.ClearCanvas />
      <MainMenu.Separator />
      <MainMenu.DefaultItems.Preferences />
      <MainMenu.DefaultItems.ToggleTheme
        allowSystemTheme
        theme={props.theme}
        onSelect={props.setTheme}
      />
      <MainMenu.ItemCustom>
        <LanguageList style={{ width: "100%" }} />
      </MainMenu.ItemCustom>
      <MainMenu.DefaultItems.ChangeCanvasBackground />
      <MainMenu.Separator />
      {props.isGuest ? (
        <MainMenu.Item
          icon={signupIcon}
          onSelect={() => window.dispatchEvent(new CustomEvent("edudraw:signup"))}
        >
          Crear cuenta gratis →
        </MainMenu.Item>
      ) : (
        <MainMenu.Item
          icon={
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          }
          onSelect={() => signOut()}
        >
          Cerrar sesión
        </MainMenu.Item>
      )}
    </MainMenu>
  );
});
