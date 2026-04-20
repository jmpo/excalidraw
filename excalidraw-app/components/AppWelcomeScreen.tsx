import { loginIcon } from "@excalidraw/excalidraw/components/icons";
import { WelcomeScreen } from "@excalidraw/excalidraw/index";
import React from "react";

// ── Shared EduDraw logo — used in WelcomeScreen and footer ────────────────────
export const EduDrawLogo = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontFamily: '"Excalifont", cursive',
      fontSize: 28,
      fontWeight: 400,
      color: "#6128ff",
    }}
  >
    <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="#6128ff" />
      <path
        d="M6 20L11 13L15 17L22 9"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    EduDraw
  </div>
);

// ── Shared menu items — base set for all users ────────────────────────────────
const BaseMenuItems = ({
  isCollabEnabled,
  onCollabDialogOpen,
}: {
  isCollabEnabled: boolean;
  onCollabDialogOpen: () => void;
}) => (
  <>
    <WelcomeScreen.Center.MenuItemLoadScene />
    <WelcomeScreen.Center.MenuItemHelp />
    {isCollabEnabled && (
      <WelcomeScreen.Center.MenuItemLiveCollaborationTrigger
        onSelect={onCollabDialogOpen}
      />
    )}
  </>
);

// ── AppWelcomeScreen ──────────────────────────────────────────────────────────
export const AppWelcomeScreen: React.FC<{
  onCollabDialogOpen: () => any;
  isCollabEnabled: boolean;
  isGuest?: boolean;
}> = React.memo(({ onCollabDialogOpen, isCollabEnabled, isGuest = false }) => {
  return (
    <WelcomeScreen>
      <WelcomeScreen.Hints.MenuHint>
        Exportar, preferencias, idiomas, ...
      </WelcomeScreen.Hints.MenuHint>
      <WelcomeScreen.Hints.ToolbarHint />
      <WelcomeScreen.Hints.HelpHint />

      <WelcomeScreen.Center>
        {/* Always EduDraw branding */}
        <WelcomeScreen.Center.Logo>
          <EduDrawLogo />
        </WelcomeScreen.Center.Logo>

        <WelcomeScreen.Center.Heading>
          {isGuest ? (
            <>
              Tus cambios no se guardan en la nube.
              <br />
              Creá una cuenta gratis para guardar tu trabajo.
            </>
          ) : (
            <>
              ¡Elige una herramienta y empieza a dibujar!
              <br />
              Tus dibujos se guardan automáticamente en la nube.
            </>
          )}
        </WelcomeScreen.Center.Heading>

        <WelcomeScreen.Center.Menu>
          <BaseMenuItems
            isCollabEnabled={isCollabEnabled}
            onCollabDialogOpen={onCollabDialogOpen}
          />

          {/* Guest CTA — replaced by nothing for registered users */}
          {isGuest && (
            <WelcomeScreen.Center.MenuItemLink
              href="/?signup=true"
              shortcut={null}
              icon={loginIcon}
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent("edudraw:signup"));
              }}
            >
              Crear cuenta gratis →
            </WelcomeScreen.Center.MenuItemLink>
          )}
        </WelcomeScreen.Center.Menu>
      </WelcomeScreen.Center>
    </WelcomeScreen>
  );
});
