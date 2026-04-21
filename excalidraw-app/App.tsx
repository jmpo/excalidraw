import {
  Excalidraw,
  LiveCollaborationTrigger,
  TTDDialogTrigger,
  CaptureUpdateAction,
  reconcileElements,
  useEditorInterface,
  ExcalidrawAPIProvider,
  useExcalidrawAPI,
  exportToBlob,
} from "@excalidraw/excalidraw";
import { trackEvent } from "@excalidraw/excalidraw/analytics";
import { getDefaultAppState } from "@excalidraw/excalidraw/appState";
import {
  CommandPalette,
  DEFAULT_CATEGORIES,
} from "@excalidraw/excalidraw/components/CommandPalette/CommandPalette";
import { ErrorDialog } from "@excalidraw/excalidraw/components/ErrorDialog";
import { OverwriteConfirmDialog } from "@excalidraw/excalidraw/components/OverwriteConfirm/OverwriteConfirm";
import { openConfirmModal } from "@excalidraw/excalidraw/components/OverwriteConfirm/OverwriteConfirmState";
import { ShareableLinkDialog } from "@excalidraw/excalidraw/components/ShareableLinkDialog";
import Trans from "@excalidraw/excalidraw/components/Trans";
import {
  APP_NAME,
  EVENT,
  THEME,
  VERSION_TIMEOUT,
  debounce,
  getVersion,
  getFrame,
  isTestEnv,
  preventUnload,
  resolvablePromise,
  isRunningInIframe,
  isDevEnv,
} from "@excalidraw/common";
import polyfill from "@excalidraw/excalidraw/polyfill";
import { useCallback, useEffect, useRef, useState, lazy, Suspense } from "react";
import { loadFromBlob } from "@excalidraw/excalidraw/data/blob";
import { t } from "@excalidraw/excalidraw/i18n";

import {
  GithubIcon,
  XBrandIcon,
  DiscordIcon,
  ExcalLogo,
  usersIcon,
  share,
  youtubeIcon,
} from "@excalidraw/excalidraw/components/icons";
import { isElementLink } from "@excalidraw/element";
import {
  bumpElementVersions,
  restoreAppState,
  restoreElements,
} from "@excalidraw/excalidraw/data/restore";
import { newElementWith } from "@excalidraw/element";
import { isInitializedImageElement } from "@excalidraw/element";
import clsx from "clsx";
import {
  parseLibraryTokensFromUrl,
  useHandleLibrary,
} from "@excalidraw/excalidraw/data/library";

import type { RemoteExcalidrawElement } from "@excalidraw/excalidraw/data/reconcile";
import type { RestoredDataState } from "@excalidraw/excalidraw/data/restore";
import type {
  FileId,
  NonDeletedExcalidrawElement,
  OrderedExcalidrawElement,
} from "@excalidraw/element/types";
import type {
  AppState,
  ExcalidrawImperativeAPI,
  BinaryFiles,
  ExcalidrawInitialDataState,
  UIAppState,
  ExcalidrawProps,
} from "@excalidraw/excalidraw/types";
import type { ResolutionType } from "@excalidraw/common/utility-types";
import type { ResolvablePromise } from "@excalidraw/common/utils";

import {
  fetchDrawing,
  fetchDrawings,
  createDrawing,
  saveDrawing,
  saveThumbnail,
  signOut,
  generateShareLink,
  fetchSharedDrawing,
  fetchProfile,
  supabase,
} from "./data/supabase";
import type { DrawingType, Profile } from "./data/supabase";
import { trackGuestSessionStart, trackGuestActivity, trackGuestToolSwitch } from "./data/guestTracking";
const Dashboard = lazy(() =>
  import("./components/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const MindMapEditor = lazy(() =>
  import("./components/MindMapEditor").then((m) => ({ default: m.MindMapEditor })),
);
import { LandingPage } from "./components/LandingPage";
import { AdminPanel } from "./components/AdminPanel";
import { OnboardingForm } from "./components/OnboardingForm";
import { LoginScreen } from "./components/LoginScreen";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { useEduLibrary } from "./data/useEduLibrary";
import { LibrarySidebar } from "./components/LibrarySidebar";

import type { LibraryItems } from "@excalidraw/excalidraw/types";

import CustomStats from "./CustomStats";
import {
  Provider,
  useAtom,
  useAtomValue,
  useAtomWithInitialValue,
  appJotaiStore,
} from "./app-jotai";
import {
  FIREBASE_STORAGE_PREFIXES,
  STORAGE_KEYS,
  SYNC_BROWSER_TABS_TIMEOUT,
} from "./app_constants";
import Collab, {
  collabAPIAtom,
  isCollaboratingAtom,
  isOfflineAtom,
} from "./collab/Collab";
import { AppFooter } from "./components/AppFooter";
import { AppMainMenu } from "./components/AppMainMenu";
import { AppWelcomeScreen } from "./components/AppWelcomeScreen";
import { TopErrorBoundary } from "./components/TopErrorBoundary";

import {
  exportToBackend,
  getCollaborationLinkData,
  importFromBackend,
  isCollaborationLink,
} from "./data";

import { updateStaleImageStatuses } from "./data/FileManager";
import { FileStatusStore } from "./data/fileStatusStore";
import {
  importFromLocalStorage,
  importUsernameFromLocalStorage,
} from "./data/localStorage";

import { loadFilesFromFirebase } from "./data/firebase";
import {
  LibraryIndexedDBAdapter,
  LibraryLocalStorageMigrationAdapter,
  LocalData,
  localStorageQuotaExceededAtom,
} from "./data/LocalData";
import { isBrowserStorageStateNewer } from "./data/tabSync";
import { ShareDialog, shareDialogStateAtom } from "./share/ShareDialog";
import CollabError, { collabErrorIndicatorAtom } from "./collab/CollabError";
import { useHandleAppTheme } from "./useHandleAppTheme";
import { getPreferredLanguage } from "./app-language/language-detector";
import { useAppLangCode } from "./app-language/language-state";
import DebugCanvas, {
  debugRenderer,
  isVisualDebuggerEnabled,
  loadSavedDebugState,
} from "./components/DebugCanvas";
import { AIComponents } from "./components/AI";
import "./index.scss";

import { AppSidebar } from "./components/AppSidebar";

import type { CollabAPI } from "./collab/Collab";

polyfill();

window.EXCALIDRAW_THROTTLE_RENDER = true;

declare global {
  interface BeforeInstallPromptEventChoiceResult {
    outcome: "accepted" | "dismissed";
  }

  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<BeforeInstallPromptEventChoiceResult>;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

let pwaEvent: BeforeInstallPromptEvent | null = null;

// Adding a listener outside of the component as it may (?) need to be
// subscribed early to catch the event.
//
// Also note that it will fire only if certain heuristics are met (user has
// used the app for some time, etc.)
window.addEventListener(
  "beforeinstallprompt",
  (event: BeforeInstallPromptEvent) => {
    // prevent Chrome <= 67 from automatically showing the prompt
    event.preventDefault();
    // cache for later use
    pwaEvent = event;
  },
);

let isSelfEmbedding = false;

if (window.self !== window.top) {
  try {
    const parentUrl = new URL(document.referrer);
    const currentUrl = new URL(window.location.href);
    if (parentUrl.origin === currentUrl.origin) {
      isSelfEmbedding = true;
    }
  } catch (error) {
    // ignore
  }
}

const shareableLinkConfirmDialog = {
  title: t("overwriteConfirm.modal.shareableLink.title"),
  description: (
    <Trans
      i18nKey="overwriteConfirm.modal.shareableLink.description"
      bold={(text) => <strong>{text}</strong>}
      br={() => <br />}
    />
  ),
  actionLabel: t("overwriteConfirm.modal.shareableLink.button"),
  color: "danger",
} as const;

const initializeScene = async (opts: {
  collabAPI: CollabAPI | null;
  excalidrawAPI: ExcalidrawImperativeAPI;
}): Promise<
  { scene: ExcalidrawInitialDataState | null } & (
    | { isExternalScene: true; id: string; key: string }
    | { isExternalScene: false; id?: null; key?: null }
  )
> => {
  const searchParams = new URLSearchParams(window.location.search);
  const id = searchParams.get("id");
  const jsonBackendMatch = window.location.hash.match(
    /^#json=([a-zA-Z0-9_-]+),([a-zA-Z0-9_-]+)$/,
  );
  const externalUrlMatch = window.location.hash.match(/^#url=(.*)$/);

  const localDataState = importFromLocalStorage();

  let scene: Omit<
    RestoredDataState,
    // we're not storing files in the scene database/localStorage, and instead
    // fetch them async from a different store
    "files"
  > & {
    scrollToContent?: boolean;
  } = {
    elements: restoreElements(localDataState?.elements, null, {
      repairBindings: true,
      deleteInvisibleElements: true,
    }),
    appState: restoreAppState(localDataState?.appState, null),
  };

  let roomLinkData = getCollaborationLinkData(window.location.href);
  const isExternalScene = !!(id || jsonBackendMatch || roomLinkData);
  if (isExternalScene) {
    if (
      // don't prompt if scene is empty
      !scene.elements.length ||
      // don't prompt for collab scenes because we don't override local storage
      roomLinkData ||
      // otherwise, prompt whether user wants to override current scene
      (await openConfirmModal(shareableLinkConfirmDialog))
    ) {
      if (jsonBackendMatch) {
        const imported = await importFromBackend(
          jsonBackendMatch[1],
          jsonBackendMatch[2],
        );

        scene = {
          elements: bumpElementVersions(
            restoreElements(imported.elements, null, {
              repairBindings: true,
              deleteInvisibleElements: true,
            }),
            localDataState?.elements,
          ),
          appState: restoreAppState(
            imported.appState,
            // local appState when importing from backend to ensure we restore
            // localStorage user settings which we do not persist on server.
            localDataState?.appState,
          ),
        };
      }
      scene.scrollToContent = true;
      if (!roomLinkData) {
        window.history.replaceState({}, APP_NAME, window.location.origin);
      }
    } else {
      // https://github.com/excalidraw/excalidraw/issues/1919
      if (document.hidden) {
        return new Promise((resolve, reject) => {
          window.addEventListener(
            "focus",
            () => initializeScene(opts).then(resolve).catch(reject),
            {
              once: true,
            },
          );
        });
      }

      roomLinkData = null;
      window.history.replaceState({}, APP_NAME, window.location.origin);
    }
  } else if (externalUrlMatch) {
    window.history.replaceState({}, APP_NAME, window.location.origin);

    const url = externalUrlMatch[1];
    try {
      const request = await fetch(window.decodeURIComponent(url));
      const data = await loadFromBlob(await request.blob(), null, null);
      if (
        !scene.elements.length ||
        (await openConfirmModal(shareableLinkConfirmDialog))
      ) {
        return { scene: data, isExternalScene };
      }
    } catch (error: any) {
      return {
        scene: {
          appState: {
            errorMessage: t("alerts.invalidSceneUrl"),
          },
        },
        isExternalScene,
      };
    }
  }

  if (roomLinkData && opts.collabAPI) {
    const { excalidrawAPI } = opts;

    const scene = await opts.collabAPI.startCollaboration(roomLinkData);

    return {
      // when collaborating, the state may have already been updated at this
      // point (we may have received updates from other clients), so reconcile
      // elements and appState with existing state
      scene: {
        ...scene,
        appState: {
          ...restoreAppState(
            {
              ...scene?.appState,
              theme: localDataState?.appState?.theme || scene?.appState?.theme,
            },
            excalidrawAPI.getAppState(),
          ),
          // necessary if we're invoking from a hashchange handler which doesn't
          // go through App.initializeScene() that resets this flag
          isLoading: false,
        },
        elements: reconcileElements(
          scene?.elements || [],
          excalidrawAPI.getSceneElementsIncludingDeleted() as RemoteExcalidrawElement[],
          excalidrawAPI.getAppState(),
        ),
      },
      isExternalScene: true,
      id: roomLinkData.roomId,
      key: roomLinkData.roomKey,
    };
  } else if (scene) {
    return isExternalScene && jsonBackendMatch
      ? {
          scene,
          isExternalScene,
          id: jsonBackendMatch[1],
          key: jsonBackendMatch[2],
        }
      : { scene, isExternalScene: false };
  }
  return { scene: null, isExternalScene: false };
};

// Module-level cache for library items — fetched once, reused across generations
let _libItemMapCache: Map<string, any[]> | null = null;
let _libItemNamesCache: string[] | null = null;

const getLibraryItemsForAI = async (): Promise<{ map: Map<string, any[]>; names: string[] }> => {
  if (_libItemMapCache && _libItemNamesCache) {
    return { map: _libItemMapCache, names: _libItemNamesCache };
  }
  const map = new Map<string, any[]>();
  const names: string[] = [];
  try {
    const res = await fetch("/edu-library.excalidrawlib");
    const json = await res.json();
    (json.libraryItems ?? []).forEach((item: any) => {
      if (item.name && item.elements?.length) {
        map.set(item.name, item.elements);
        names.push(item.name);
      }
    });
    _libItemMapCache = map;
    _libItemNamesCache = names;
  } catch {
    // proceed without library items
  }
  return { map, names };
};

const ExcalidrawWrapper = ({
  drawingId,
  onBackToDashboard,
  isGuest = false,
}: {
  drawingId: string;
  onBackToDashboard: () => void;
  isGuest?: boolean;
}) => {
  const excalidrawAPI = useExcalidrawAPI();
  const guestActivityTracker = useRef(
    debounce((count: number) => trackGuestActivity(count).catch(() => {}), 10000),
  ).current;
  // Stores the latest unsaved state so we can flush on unmount
  const pendingSaveRef = useRef<{
    id: string;
    elements: readonly OrderedExcalidrawElement[];
    appState: AppState;
  } | null>(null);

  const supabaseSave = useRef(
    debounce(
      (
        id: string,
        elements: readonly OrderedExcalidrawElement[],
        appState: AppState,
      ) => {
        // collaborators es un Map — no serializable, se excluye del guardado
        const { collaborators: _c, ...serializableAppState } = appState;
        saveDrawing(id, {
          elements: elements as unknown[],
          appState: serializableAppState as unknown as Record<string, unknown>,
        })
          .then(() => {
            pendingSaveRef.current = null;
            console.debug("[EduDraw] saved drawing", id);
          })
          .catch((err) => {
            console.error("[EduDraw] save error:", err);
          });
      },
      3000,
    ),
  ).current;

  // Flush pending save immediately when the component unmounts (e.g. user goes back to dashboard)
  useEffect(() => {
    return () => {
      supabaseSave.flush?.();
      if (pendingSaveRef.current) {
        const { id, elements, appState } = pendingSaveRef.current;
        const { collaborators: _c, ...serializableAppState } = appState;
        saveDrawing(id, {
          elements: elements as unknown[],
          appState: serializableAppState as unknown as Record<string, unknown>,
        }).catch(console.error);
        pendingSaveRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const thumbnailSave = useRef(
    debounce(
      (
        id: string,
        elements: readonly OrderedExcalidrawElement[],
        appState: AppState,
        files: BinaryFiles,
      ) => {
        const nonDeleted = elements.filter((el) => !el.isDeleted);
        if (nonDeleted.length === 0) return;
        exportToBlob({
          elements: nonDeleted,
          appState: {
            ...appState,
            exportBackground: true,
            viewBackgroundColor: appState.viewBackgroundColor || "#ffffff",
          },
          files,
          mimeType: "image/webp",
          quality: 0.6,
          getDimensions: (w, h) => {
            const MAX = 480;
            const scale = Math.min(1, MAX / Math.max(w, h, 1));
            return { width: Math.round(w * scale), height: Math.round(h * scale), scale };
          },
        })
          .then((blob) => {
            const reader = new FileReader();
            reader.onload = () =>
              saveThumbnail(id, reader.result as string).catch(console.error);
            reader.readAsDataURL(blob);
          })
          .catch(console.error);
      },
      30000,
    ),
  ).current;

  const [errorMessage, setErrorMessage] = useState("");
  const isCollabDisabled = isRunningInIframe();

  const { editorTheme, appTheme, setAppTheme } = useHandleAppTheme();

  const [langCode, setLangCode] = useAppLangCode();

  const editorInterface = useEditorInterface();

  // initial state
  // ---------------------------------------------------------------------------

  const initialStatePromiseRef = useRef<{
    promise: ResolvablePromise<ExcalidrawInitialDataState | null>;
  }>({ promise: null! });
  if (!initialStatePromiseRef.current.promise) {
    initialStatePromiseRef.current.promise =
      resolvablePromise<ExcalidrawInitialDataState | null>();
  }

  const debugCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    trackEvent("load", "frame", getFrame());
    // Delayed so that the app has a time to load the latest SW
    setTimeout(() => {
      trackEvent("load", "version", getVersion());
    }, VERSION_TIMEOUT);
  }, []);

  const [, setShareDialogState] = useAtom(shareDialogStateAtom);
  const [collabAPI] = useAtom(collabAPIAtom);
  const [isCollaborating] = useAtomWithInitialValue(isCollaboratingAtom, () => {
    return isCollaborationLink(window.location.href);
  });
  const collabError = useAtomValue(collabErrorIndicatorAtom);

  useHandleLibrary({
    excalidrawAPI,
    adapter: LibraryIndexedDBAdapter,
    // TODO maybe remove this in several months (shipped: 24-03-11)
    migrationAdapter: LibraryLocalStorageMigrationAdapter,
  });

  useEduLibrary(excalidrawAPI);

  const [libraryItems, setLibraryItems] = useState<LibraryItems>([]);
  const [showLibrarySidebar, setShowLibrarySidebar] = useState(true);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [showAiWhiteboardModal, setShowAiWhiteboardModal] = useState(false);
  const [aiWbTab, setAiWbTab] = useState<"text" | "pdf">("text");
  const [aiWbText, setAiWbText] = useState("");
  const [aiWbPdfFile, setAiWbPdfFile] = useState<File | null>(null);
  const [aiWbPdfPageCount, setAiWbPdfPageCount] = useState(0);
  const [aiWbLoading, setAiWbLoading] = useState(false);
  const [aiWbLoadingStep, setAiWbLoadingStep] = useState<"extracting" | "generating" | null>(null);
  const [aiWbError, setAiWbError] = useState<string | null>(null);
  // Refs so generateAiWhiteboard always reads latest values without stale closure
  const aiWbTabRef = useRef(aiWbTab);
  const aiWbTextRef = useRef(aiWbText);
  const aiWbPdfFileRef = useRef(aiWbPdfFile);
  aiWbTabRef.current = aiWbTab;
  aiWbTextRef.current = aiWbText;
  aiWbPdfFileRef.current = aiWbPdfFile;

  const enterPresentation = useCallback(() => {
    setIsPresentationMode(true);
    setShowLibrarySidebar(false);
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  const exitPresentation = useCallback(() => {
    setIsPresentationMode(false);
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const generateAiWhiteboard = useCallback(async () => {
    // Always read from refs to avoid stale closure
    const tab = aiWbTabRef.current;
    const wbText = aiWbTextRef.current;
    const pdfFile = aiWbPdfFileRef.current;

    if (tab === "text" && !wbText.trim()) return;
    if (tab === "pdf" && !pdfFile) return;
    setAiWbLoading(true);
    setAiWbError(null);
    try {
      let text = wbText;
      if (tab === "pdf" && pdfFile) {
        setAiWbLoadingStep("extracting");
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;
        const ab = await pdfFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
        const pages = Math.min(pdf.numPages, 40);
        const texts: string[] = [];
        for (let i = 1; i <= pages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          texts.push(content.items.map((item: any) => item.str).join(" "));
        }
        text = texts.join("\n");
        if (!text.trim()) throw new Error("No se pudo extraer texto del PDF.");
      }
      setAiWbLoadingStep("generating");

      // Use cached library items (fetched once per session)
      const { map: libraryItemMap, names: availableItemNames } = await getLibraryItemsForAI();

      const { data, error } = await supabase.functions.invoke("ai-whiteboard", {
        body: { text, availableItems: availableItemNames },
      });
      if (error) throw new Error(`Edge Function error: ${error.message} | ${JSON.stringify(data)}`);
      if (!data || !data.sections) throw new Error(`Respuesta inesperada del servidor: ${JSON.stringify(data)}`);

      const wb = data as {
        title: string;
        sections: { heading: string; color: string; items: string[] }[];
        suggestedItems?: string[];
      };
      const elements: any[] = [];
      let idCounter = Date.now();
      const getId = () => (++idCounter).toString(36);
      const now = Date.now();

      // Helper: create a properly-structured text element
      const mkText = (txt: string, x: number, y: number, w: number, fontSize: number, color: string, lineHeight = 1.25) => ({
        type: "text", id: getId(), x, y, width: w, height: fontSize * lineHeight + 4,
        angle: 0, strokeColor: color, backgroundColor: "transparent",
        fillStyle: "solid", strokeWidth: 1, strokeStyle: "solid", roughness: 0, opacity: 100,
        groupIds: [], frameId: null, roundness: null, seed: ++idCounter, version: 1,
        versionNonce: ++idCounter, isDeleted: false, boundElements: null,
        updated: now, link: null, locked: false,
        text: txt, originalText: txt, fontSize, fontFamily: 2,
        textAlign: "left", verticalAlign: "top", containerId: null,
        lineHeight, autoResize: true,
      });

      // Helper: place a library item's elements at a target position, scaled to targetWidth
      const placeLibraryElements = (srcElements: any[], targetX: number, targetY: number, targetWidth: number) => {
        if (!srcElements.length) return;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        srcElements.forEach((el: any) => {
          minX = Math.min(minX, el.x ?? 0);
          minY = Math.min(minY, el.y ?? 0);
          maxX = Math.max(maxX, (el.x ?? 0) + (el.width ?? 0));
          maxY = Math.max(maxY, (el.y ?? 0) + (el.height ?? 0));
        });
        const origW = maxX - minX;
        const origH = maxY - minY;
        if (origW <= 0 || origH <= 0) return;
        const scale = Math.min(targetWidth / origW, 400 / origH); // cap height at 400px

        srcElements.forEach((el: any) => {
          const placed: any = {
            ...el,
            id: getId(),
            x: targetX + (el.x - minX) * scale,
            y: targetY + (el.y - minY) * scale,
            width: (el.width ?? 0) * scale,
            height: (el.height ?? 0) * scale,
            seed: ++idCounter,
            version: 1,
            versionNonce: ++idCounter,
            isDeleted: false,
            updated: now,
            boundElements: null,
            groupIds: [],
            frameId: null,
          };
          if (el.fontSize) placed.fontSize = el.fontSize * scale;
          if (el.points) placed.points = el.points.map(([px, py]: [number, number]) => [px * scale, py * scale]);
          // Remove fields that cause issues
          delete placed.containerId;
          delete placed.boundElementIds;
          delete placed.strokeSharpness;
          elements.push(placed);
        });
      };

      // Title
      elements.push(mkText(wb.title, 60, 20, 900, 26, "#111827", 1.3));

      const cols = Math.min(wb.sections.length, 3);
      const cardW = 320, cardH = 260, gapX = 28, gapY = 24, startX = 60, startY = 80;

      wb.sections.forEach((sec, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const x = startX + col * (cardW + gapX), y = startY + row * (cardH + gapY);

        // Card background
        elements.push({
          type: "rectangle", id: getId(), x, y, width: cardW, height: cardH,
          angle: 0, strokeColor: "#d1d5db", backgroundColor: sec.color,
          fillStyle: "solid", strokeWidth: 1, strokeStyle: "solid", roughness: 0, opacity: 100,
          groupIds: [], frameId: null, roundness: { type: 3, value: 8 },
          seed: ++idCounter, version: 1, versionNonce: ++idCounter,
          isDeleted: false, boundElements: null, updated: now, link: null, locked: false,
        });

        // Section heading
        elements.push(mkText(sec.heading, x + 16, y + 14, cardW - 32, 15, "#1f2937", 1.3));
        // Divider line
        elements.push({
          type: "line", id: getId(), x: x + 16, y: y + 40, width: cardW - 32, height: 0,
          angle: 0, strokeColor: "#9ca3af", backgroundColor: "transparent",
          fillStyle: "solid", strokeWidth: 1, strokeStyle: "solid", roughness: 0, opacity: 60,
          groupIds: [], frameId: null, roundness: null, seed: ++idCounter, version: 1,
          versionNonce: ++idCounter, isDeleted: false, boundElements: null,
          updated: now, link: null, locked: false,
          points: [[0, 0], [cardW - 32, 0]], lastCommittedPoint: null, startBinding: null, endBinding: null, startArrowhead: null, endArrowhead: null,
        });
        // Items
        sec.items.forEach((item, j) => {
          elements.push(mkText(`• ${item}`, x + 16, y + 50 + j * 36, cardW - 32, 13, "#374151"));
        });
      });

      // Place suggested library items below the cards
      if (wb.suggestedItems?.length) {
        const totalRows = Math.ceil(wb.sections.length / cols);
        const cardsBottomY = startY + totalRows * (cardH + gapY) + 20;
        const totalCardsWidth = cols * cardW + (cols - 1) * gapX;
        const itemWidth = Math.floor(totalCardsWidth / Math.min(wb.suggestedItems.length, 3)) - 20;
        let libX = startX;

        wb.suggestedItems.slice(0, 3).forEach((name) => {
          const srcElements = libraryItemMap.get(name);
          if (!srcElements) return;
          placeLibraryElements(srcElements, libX, cardsBottomY, itemWidth);
          libX += itemWidth + 20;
        });
      }

      excalidrawAPI?.updateScene({ elements });
      excalidrawAPI?.scrollToContent(elements, { animate: true, fitToViewport: true });
      setShowAiWhiteboardModal(false);
      setAiWbText("");
      setAiWbPdfFile(null);
      setAiWbPdfPageCount(0);
    } catch (err: any) {
      setAiWbError(err?.message ?? "Error al generar el contenido. Intentá de nuevo.");
    } finally {
      setAiWbLoading(false);
      setAiWbLoadingStep(null);
    }
  }, [excalidrawAPI]);

  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) setIsPresentationMode(false);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const [, forceRefresh] = useState(false);

  useEffect(() => {
    if (isDevEnv()) {
      const debugState = loadSavedDebugState();

      if (debugState.enabled && !window.visualDebug) {
        window.visualDebug = {
          data: [],
        };
      } else {
        delete window.visualDebug;
      }
      forceRefresh((prev) => !prev);
    }
  }, [excalidrawAPI]);

  // ---------------------------------------------------------------------------
  // Hoisted loadImages
  // ---------------------------------------------------------------------------
  const loadImages = useCallback(
    (data: ResolutionType<typeof initializeScene>, isInitialLoad = false) => {
      if (!data.scene || !excalidrawAPI) {
        return;
      }

      if (collabAPI?.isCollaborating()) {
        if (data.scene.elements) {
          collabAPI
            .fetchImageFilesFromFirebase({
              elements: data.scene.elements,
              forceFetchFiles: true,
            })
            .then(({ loadedFiles, erroredFiles }) => {
              excalidrawAPI.addFiles(loadedFiles);
              updateStaleImageStatuses({
                excalidrawAPI,
                erroredFiles,
                elements: excalidrawAPI.getSceneElementsIncludingDeleted(),
              });
            });
        }
      } else {
        const fileIds =
          data.scene.elements?.reduce((acc, element) => {
            if (isInitializedImageElement(element)) {
              return acc.concat(element.fileId);
            }
            return acc;
          }, [] as FileId[]) || [];

        if (data.isExternalScene) {
          if (fileIds.length) {
            // Direct Firebase call (not through FileManager), so track manually
            FileStatusStore.updateStatuses(
              fileIds.map((id) => [id, "loading"]),
            );
          }
          loadFilesFromFirebase(
            `${FIREBASE_STORAGE_PREFIXES.shareLinkFiles}/${data.id}`,
            data.key,
            fileIds,
          ).then(({ loadedFiles, erroredFiles }) => {
            excalidrawAPI.addFiles(loadedFiles);
            updateStaleImageStatuses({
              excalidrawAPI,
              erroredFiles,
              elements: excalidrawAPI.getSceneElementsIncludingDeleted(),
            });
            FileStatusStore.updateStatuses([
              ...loadedFiles.map((f) => [f.id, "loaded"] as [FileId, "loaded"]),
              ...[...erroredFiles.keys()].map(
                (id) => [id, "error"] as [FileId, "error"],
              ),
            ]);
          });
        } else if (isInitialLoad) {
          if (fileIds.length) {
            LocalData.fileStorage
              .getFiles(fileIds)
              .then(async ({ loadedFiles, erroredFiles }) => {
                if (loadedFiles.length) {
                  excalidrawAPI.addFiles(loadedFiles);
                }
                updateStaleImageStatuses({
                  excalidrawAPI,
                  erroredFiles,
                  elements: excalidrawAPI.getSceneElementsIncludingDeleted(),
                });
              });
          }
          // on fresh load, clear unused files from IDB (from previous
          // session)
          LocalData.fileStorage.clearObsoleteFiles({
            currentFileIds: fileIds,
          });
        }
      }
    },
    [collabAPI, excalidrawAPI],
  );

  useEffect(() => {
    if (!excalidrawAPI || (!isCollabDisabled && !collabAPI)) {
      return;
    }

    const loadScene = async () => {
      if (drawingId === "__guest__") {
        // Load from browser localStorage so returning guests keep their work
        const data = await initializeScene({ collabAPI, excalidrawAPI });
        loadImages(data, true);
        initialStatePromiseRef.current.promise.resolve(data.scene);
        return;
      }
      const supabaseDrawing = await fetchDrawing(drawingId).catch(() => null);
      if (supabaseDrawing) {
        // Dibujo encontrado en Supabase — usar su contenido (puede estar vacío)
        const elements = (supabaseDrawing.content?.elements ?? []) as Parameters<typeof restoreElements>[0];
        const appState = (supabaseDrawing.content?.appState ?? {}) as Parameters<typeof restoreAppState>[0];
        initialStatePromiseRef.current.promise.resolve({
          elements: restoreElements(elements, null, {
            repairBindings: true,
            deleteInvisibleElements: true,
          }),
          appState: restoreAppState(
            { ...appState, collaborators: new Map() },
            null,
          ),
        });
        return;
      }
      const data = await initializeScene({ collabAPI, excalidrawAPI });
      loadImages(data, true);
      initialStatePromiseRef.current.promise.resolve(data.scene);
    };

    loadScene();

    const onHashChange = async (event: HashChangeEvent) => {
      event.preventDefault();
      const libraryUrlTokens = parseLibraryTokensFromUrl();
      if (!libraryUrlTokens) {
        if (
          collabAPI?.isCollaborating() &&
          !isCollaborationLink(window.location.href)
        ) {
          collabAPI.stopCollaboration(false);
        }
        excalidrawAPI.updateScene({ appState: { isLoading: true } });

        initializeScene({ collabAPI, excalidrawAPI }).then((data) => {
          loadImages(data);
          if (data.scene) {
            excalidrawAPI.updateScene({
              elements: restoreElements(data.scene.elements, null, {
                repairBindings: true,
              }),
              appState: restoreAppState(data.scene.appState, null),
              captureUpdate: CaptureUpdateAction.IMMEDIATELY,
            });
          }
        });
      }
    };

    const syncData = debounce(() => {
      if (isTestEnv()) {
        return;
      }
      if (
        !document.hidden &&
        ((collabAPI && !collabAPI.isCollaborating()) || isCollabDisabled)
      ) {
        // don't sync if local state is newer or identical to browser state
        if (isBrowserStorageStateNewer(STORAGE_KEYS.VERSION_DATA_STATE)) {
          const localDataState = importFromLocalStorage();
          const username = importUsernameFromLocalStorage();
          setLangCode(getPreferredLanguage());
          excalidrawAPI.updateScene({
            ...localDataState,
            captureUpdate: CaptureUpdateAction.NEVER,
          });
          LibraryIndexedDBAdapter.load().then((data) => {
            if (data) {
              excalidrawAPI.updateLibrary({
                libraryItems: data.libraryItems,
              });
            }
          });
          collabAPI?.setUsername(username || "");
        }

        if (isBrowserStorageStateNewer(STORAGE_KEYS.VERSION_FILES)) {
          const elements = excalidrawAPI.getSceneElementsIncludingDeleted();
          const currFiles = excalidrawAPI.getFiles();
          const fileIds =
            elements?.reduce((acc, element) => {
              if (
                isInitializedImageElement(element) &&
                // only load and update images that aren't already loaded
                !currFiles[element.fileId]
              ) {
                return acc.concat(element.fileId);
              }
              return acc;
            }, [] as FileId[]) || [];
          if (fileIds.length) {
            LocalData.fileStorage
              .getFiles(fileIds)
              .then(({ loadedFiles, erroredFiles }) => {
                if (loadedFiles.length) {
                  excalidrawAPI.addFiles(loadedFiles);
                }
                updateStaleImageStatuses({
                  excalidrawAPI,
                  erroredFiles,
                  elements: excalidrawAPI.getSceneElementsIncludingDeleted(),
                });
              });
          }
        }
      }
    }, SYNC_BROWSER_TABS_TIMEOUT);

    const onUnload = () => {
      LocalData.flushSave();
    };

    const visibilityChange = (event: FocusEvent | Event) => {
      if (event.type === EVENT.BLUR || document.hidden) {
        LocalData.flushSave();
      }
      if (
        event.type === EVENT.VISIBILITY_CHANGE ||
        event.type === EVENT.FOCUS
      ) {
        syncData();
      }
    };

    window.addEventListener(EVENT.HASHCHANGE, onHashChange, false);
    window.addEventListener(EVENT.UNLOAD, onUnload, false);
    window.addEventListener(EVENT.BLUR, visibilityChange, false);
    document.addEventListener(EVENT.VISIBILITY_CHANGE, visibilityChange, false);
    window.addEventListener(EVENT.FOCUS, visibilityChange, false);
    return () => {
      window.removeEventListener(EVENT.HASHCHANGE, onHashChange, false);
      window.removeEventListener(EVENT.UNLOAD, onUnload, false);
      window.removeEventListener(EVENT.BLUR, visibilityChange, false);
      window.removeEventListener(EVENT.FOCUS, visibilityChange, false);
      document.removeEventListener(
        EVENT.VISIBILITY_CHANGE,
        visibilityChange,
        false,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCollabDisabled, collabAPI, excalidrawAPI, setLangCode, loadImages]);

  useEffect(() => {
    const unloadHandler = (event: BeforeUnloadEvent) => {
      LocalData.flushSave();

      if (
        excalidrawAPI &&
        LocalData.fileStorage.shouldPreventUnload(
          excalidrawAPI.getSceneElements(),
        )
      ) {
        if (import.meta.env.VITE_APP_DISABLE_PREVENT_UNLOAD !== "true") {
          preventUnload(event);
        } else {
          console.warn(
            "preventing unload disabled (VITE_APP_DISABLE_PREVENT_UNLOAD)",
          );
        }
      }
    };
    window.addEventListener(EVENT.BEFORE_UNLOAD, unloadHandler);
    return () => {
      window.removeEventListener(EVENT.BEFORE_UNLOAD, unloadHandler);
    };
  }, [excalidrawAPI]);

  const onChange = (
    elements: readonly OrderedExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles,
  ) => {
    if (collabAPI?.isCollaborating()) {
      collabAPI.syncElements(elements);
    }

    if (drawingId !== "__guest__") {
      pendingSaveRef.current = { id: drawingId, elements, appState };
      supabaseSave(drawingId, elements, appState);
      thumbnailSave(drawingId, elements, appState, files);
    } else {
      const activeCount = elements.filter((el) => !el.isDeleted).length;
      if (activeCount > 0) guestActivityTracker(activeCount);
    }

    // this check is redundant, but since this is a hot path, it's best
    // not to evaludate the nested expression every time
    if (!LocalData.isSavePaused()) {
      LocalData.save(elements, appState, files, () => {
        if (excalidrawAPI) {
          let didChange = false;

          const elements = excalidrawAPI
            .getSceneElementsIncludingDeleted()
            .map((element) => {
              if (
                LocalData.fileStorage.shouldUpdateImageElementStatus(element)
              ) {
                const newElement = newElementWith(element, { status: "saved" });
                if (newElement !== element) {
                  didChange = true;
                }
                return newElement;
              }
              return element;
            });

          if (didChange) {
            excalidrawAPI.updateScene({
              elements,
              captureUpdate: CaptureUpdateAction.NEVER,
            });
          }
        }
      });
    }

    // Render the debug scene if the debug canvas is available
    if (debugCanvasRef.current && excalidrawAPI) {
      debugRenderer(
        debugCanvasRef.current,
        appState,
        elements,
        window.devicePixelRatio,
      );
    }
  };

  const [latestShareableLink, setLatestShareableLink] = useState<string | null>(
    null,
  );

  const onExportToBackend = async () => {
    try {
      const link = await generateShareLink(drawingId);
      setLatestShareableLink(link);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const renderCustomStats = (
    elements: readonly NonDeletedExcalidrawElement[],
    appState: UIAppState,
  ) => {
    return (
      <CustomStats
        setToast={(message) => excalidrawAPI!.setToast({ message })}
        appState={appState}
        elements={elements}
      />
    );
  };

  const isOffline = useAtomValue(isOfflineAtom);

  const localStorageQuotaExceeded = useAtomValue(localStorageQuotaExceededAtom);

  const onCollabDialogOpen = useCallback(
    () => setShareDialogState({ isOpen: true, type: "collaborationOnly" }),
    [setShareDialogState],
  );

  // ---------------------------------------------------------------------------
  // onExport — intercepts file save to wait for pending image loads
  // ---------------------------------------------------------------------------
  const onExport: Required<ExcalidrawProps>["onExport"] = useCallback(
    async function* () {
      let snapshot = FileStatusStore.getSnapshot();
      const { pending, total } = FileStatusStore.getPendingCount(
        snapshot.value,
      );
      if (pending === 0) {
        return;
      }

      // Yield initial progress
      yield {
        type: "progress",
        progress: (total - pending) / total,
        message: `Loading images (${total - pending}/${total})...`,
      };

      // Wait for all pending images to finish
      while (true) {
        snapshot = await FileStatusStore.pull(snapshot.version);
        const { pending: nowPending, total: nowTotal } =
          FileStatusStore.getPendingCount(snapshot.value);

        yield {
          type: "progress",
          progress: (nowTotal - nowPending) / nowTotal,
          message: `Loading images (${nowTotal - nowPending}/${nowTotal})...`,
        };

        if (nowPending === 0) {
          await new Promise((r) => setTimeout(r, 500));
          yield {
            type: "progress",
            message: `Preparing export...`,
          };
          return;
        }
      }
    },
    [],
  );

  // const onExport = () => {
  //   return new Promise((r) => setTimeout(r, 2500));
  //   // console.log("onExport");
  // };

  // browsers generally prevent infinite self-embedding, there are
  // cases where it still happens, and while we disallow self-embedding
  // by not whitelisting our own origin, this serves as an additional guard
  if (isSelfEmbedding) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          height: "100%",
        }}
      >
        <h1>I'm not a pretzel!</h1>
      </div>
    );
  }


  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
    <div
      style={{ flex: 1, minWidth: 0, height: "100%" }}
      className={clsx("excalidraw-app", {
        "is-collaborating": isCollaborating,
      })}
    >
      <Excalidraw
        viewModeEnabled={isPresentationMode}
        onChange={onChange}
        onExport={onExport}
        initialData={initialStatePromiseRef.current.promise}
        isCollaborating={isCollaborating}
        onPointerUpdate={collabAPI?.onPointerUpdate}
        UIOptions={{
          canvasActions: {
            toggleTheme: true,
            export: {
              onExportToBackend: isGuest
                ? undefined
                : onExportToBackend,
            },
          },
        }}
        langCode={langCode}
        renderCustomStats={renderCustomStats}
        detectScroll={false}
        handleKeyboardGlobally={true}
        autoFocus={true}
        theme={editorTheme}
        renderTopRightUI={(isMobile) => {
          if (isMobile || !collabAPI || isCollabDisabled) {
            return null;
          }

          return (
            <div className="excalidraw-ui-top-right">
              <button
                style={{
                  padding: "6px 12px",
                  background: "#6965db",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  marginRight: 6,
                }}
                onClick={onBackToDashboard}
                title={isGuest ? "Volver al inicio" : "Volver al dashboard"}
              >
                {isGuest ? "← Inicio" : "← Mis dibujos"}
              </button>
              <button
                style={{
                  padding: "6px 12px",
                  background: showLibrarySidebar ? "#6965db" : "#fff",
                  color: showLibrarySidebar ? "#fff" : "#6965db",
                  border: "1.5px solid #6965db",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  marginRight: 6,
                }}
                onClick={() => setShowLibrarySidebar((v) => !v)}
                title={showLibrarySidebar ? "Ocultar biblioteca" : "Mostrar biblioteca"}
              >
                📚 Biblioteca
              </button>
              <button
                style={{
                  padding: "6px 12px",
                  background: "linear-gradient(135deg,#7c4bff,#6128ff)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  marginRight: 6,
                }}
                onClick={() => { setShowAiWhiteboardModal(true); setAiWbError(null); }}
                title="Generar pizarrón con IA"
              >
                ✨ Generar con IA
              </button>
              <button
                style={{
                  padding: "6px 12px",
                  background: "#fff",
                  color: "#333",
                  border: "1.5px solid #ccc",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  marginRight: 8,
                }}
                onClick={enterPresentation}
                title="Modo presentación"
              >
                ▶ Presentar
              </button>

              {collabError.message && <CollabError collabError={collabError} />}
              <LiveCollaborationTrigger
                isCollaborating={isCollaborating}
                onSelect={() =>
                  setShareDialogState({ isOpen: true, type: "share" })
                }
                editorInterface={editorInterface}
              />
            </div>
          );
        }}
        onLibraryChange={setLibraryItems}
        onLinkOpen={(element, event) => {
          if (element.link && isElementLink(element.link)) {
            event.preventDefault();
            excalidrawAPI?.scrollToContent(element.link, { animate: true });
          }
        }}
      >
        <AppMainMenu
          onCollabDialogOpen={onCollabDialogOpen}
          isCollaborating={isCollaborating}
          isCollabEnabled={!isCollabDisabled}
          theme={appTheme}
          setTheme={(theme) => setAppTheme(theme)}
          refresh={() => forceRefresh((prev) => !prev)}
          onBackToDashboard={onBackToDashboard}
          isGuest={isGuest}
        />
        <AppWelcomeScreen
          onCollabDialogOpen={onCollabDialogOpen}
          isCollabEnabled={!isCollabDisabled}
          isGuest={isGuest}
        />
        <OverwriteConfirmDialog>
          <OverwriteConfirmDialog.Actions.SaveToDisk />
          <OverwriteConfirmDialog.Actions.ExportToImage />
        </OverwriteConfirmDialog>
        <AppFooter onChange={() => excalidrawAPI?.refresh()} />
        {excalidrawAPI && <AIComponents excalidrawAPI={excalidrawAPI} />}

        <TTDDialogTrigger />
        {isCollaborating && isOffline && (
          <div className="alertalert--warning">
            {t("alerts.collabOfflineWarning")}
          </div>
        )}
        {localStorageQuotaExceeded && (
          <div className="alert alert--danger">
            {t("alerts.localStorageQuotaExceeded")}
          </div>
        )}
        {latestShareableLink && (
          <ShareableLinkDialog
            link={latestShareableLink}
            onCloseRequest={() => setLatestShareableLink(null)}
            setErrorMessage={setErrorMessage}
          />
        )}
        {excalidrawAPI && !isCollabDisabled && (
          <Collab excalidrawAPI={excalidrawAPI} />
        )}

        <ShareDialog
          collabAPI={collabAPI}
          onExportToBackend={async () => {
            if (isGuest) {
              setErrorMessage("Creá una cuenta para compartir tu dibujo.");
              return;
            }
            try {
              const link = await generateShareLink(drawingId);
              setLatestShareableLink(link);
            } catch (error: any) {
              setErrorMessage(error.message);
            }
          }}
        />

        <AppSidebar />

        {errorMessage && (
          <ErrorDialog onClose={() => setErrorMessage("")}>
            {errorMessage}
          </ErrorDialog>
        )}

        <CommandPalette
          customCommandPaletteItems={[
            {
              label: t("labels.liveCollaboration"),
              category: DEFAULT_CATEGORIES.app,
              keywords: [
                "team",
                "multiplayer",
                "share",
                "public",
                "session",
                "invite",
              ],
              icon: usersIcon,
              perform: () => {
                setShareDialogState({
                  isOpen: true,
                  type: "collaborationOnly",
                });
              },
            },
            {
              label: t("roomDialog.button_stopSession"),
              category: DEFAULT_CATEGORIES.app,
              predicate: () => !!collabAPI?.isCollaborating(),
              keywords: [
                "stop",
                "session",
                "end",
                "leave",
                "close",
                "exit",
                "collaboration",
              ],
              perform: () => {
                if (collabAPI) {
                  collabAPI.stopCollaboration();
                  if (!collabAPI.isCollaborating()) {
                    setShareDialogState({ isOpen: false });
                  }
                }
              },
            },
            {
              label: t("labels.share"),
              category: DEFAULT_CATEGORIES.app,
              predicate: true,
              icon: share,
              keywords: [
                "link",
                "shareable",
                "readonly",
                "export",
                "publish",
                "snapshot",
                "url",
                "collaborate",
                "invite",
              ],
              perform: async () => {
                setShareDialogState({ isOpen: true, type: "share" });
              },
            },
            {
              label: "GitHub",
              icon: GithubIcon,
              category: DEFAULT_CATEGORIES.links,
              predicate: true,
              keywords: [
                "issues",
                "bugs",
                "requests",
                "report",
                "features",
                "social",
                "community",
              ],
              perform: () => {
                window.open(
                  "https://github.com/excalidraw/excalidraw",
                  "_blank",
                  "noopener noreferrer",
                );
              },
            },
            {
              label: t("labels.followUs"),
              icon: XBrandIcon,
              category: DEFAULT_CATEGORIES.links,
              predicate: true,
              keywords: ["twitter", "contact", "social", "community"],
              perform: () => {
                window.open(
                  "https://x.com/excalidraw",
                  "_blank",
                  "noopener noreferrer",
                );
              },
            },
            {
              label: t("labels.discordChat"),
              category: DEFAULT_CATEGORIES.links,
              predicate: true,
              icon: DiscordIcon,
              keywords: [
                "chat",
                "talk",
                "contact",
                "bugs",
                "requests",
                "report",
                "feedback",
                "suggestions",
                "social",
                "community",
              ],
              perform: () => {
                window.open(
                  "https://discord.gg/UexuTaE",
                  "_blank",
                  "noopener noreferrer",
                );
              },
            },
            {
              label: "YouTube",
              icon: youtubeIcon,
              category: DEFAULT_CATEGORIES.links,
              predicate: true,
              keywords: ["features", "tutorials", "howto", "help", "community"],
              perform: () => {
                window.open(
                  "https://youtube.com/@excalidraw",
                  "_blank",
                  "noopener noreferrer",
                );
              },
            },
            {
              ...CommandPalette.defaultItems.toggleTheme,
              perform: () => {
                setAppTheme(
                  editorTheme === THEME.DARK ? THEME.LIGHT : THEME.DARK,
                );
              },
            },
            {
              label: t("labels.installPWA"),
              category: DEFAULT_CATEGORIES.app,
              predicate: () => !!pwaEvent,
              perform: () => {
                if (pwaEvent) {
                  pwaEvent.prompt();
                  pwaEvent.userChoice.then(() => {
                    // event cannot be reused, but we'll hopefully
                    // grab new one as the event should be fired again
                    pwaEvent = null;
                  });
                }
              },
            },
          ]}
        />
        {isVisualDebuggerEnabled() && excalidrawAPI && (
          <DebugCanvas
            appState={excalidrawAPI.getAppState()}
            scale={window.devicePixelRatio}
            ref={debugCanvasRef}
          />
        )}
      </Excalidraw>
    </div>
    {showLibrarySidebar && excalidrawAPI && !isPresentationMode && (
      <LibrarySidebar
        libraryItems={libraryItems}
        excalidrawAPI={excalidrawAPI}
        onClose={() => setShowLibrarySidebar(false)}
      />
    )}
    {isPresentationMode && (
      <button
        onClick={exitPresentation}
        title="Salir de presentación (Esc)"
        style={{
          position: "fixed",
          top: 12,
          right: 12,
          zIndex: 99999,
          padding: "8px 16px",
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        ✕ Salir
      </button>
    )}

    {/* AI Whiteboard modal */}
    {showAiWhiteboardModal && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(15,10,40,0.6)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
        onClick={() => !aiWbLoading && setShowAiWhiteboardModal(false)}>
        <div style={{ background: "#fff", borderRadius: 24, width: 620, maxWidth: "95vw", boxShadow: "0 24px 80px rgba(0,0,0,0.3)", overflow: "hidden" }}
          onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg,#7c4bff 0%,#6128ff 100%)", padding: "24px 28px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>✨</div>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, color: "#fff", fontWeight: 800 }}>Generar pizarrón con IA</h2>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>Texto o PDF → tarjetas visuales en el canvas</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              {([["text","📝 Texto"], ["pdf","📄 PDF"]] as const).map(([tab, label]) => (
                <button key={tab} onClick={() => { if (!aiWbLoading) setAiWbTab(tab); }}
                  style={{ padding: "7px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: aiWbLoading ? "not-allowed" : "pointer", border: "none", transition: "all .15s",
                    background: aiWbTab === tab ? "#fff" : "rgba(255,255,255,0.15)",
                    color: aiWbTab === tab ? "#6128ff" : "rgba(255,255,255,0.85)" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: "24px 28px 28px" }}>
            {aiWbTab === "text" ? (
              <>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  {["Resumen de clase", "Plan de proyecto", "Proceso de trabajo", "Ideas de negocio", "Estrategia de marketing"].map((ex) => (
                    <button key={ex} onClick={() => setAiWbText(ex + ": ")} disabled={aiWbLoading}
                      style={{ background: "#f0efff", border: "1px solid #dddaff", borderRadius: 20, padding: "4px 13px", fontSize: 12, color: "#6965db", cursor: "pointer", fontWeight: 500 }}>
                      {ex}
                    </button>
                  ))}
                </div>
                <textarea value={aiWbText} onChange={(e) => setAiWbText(e.target.value)} disabled={aiWbLoading}
                  placeholder={"Describí lo que querés visualizar en el pizarrón…\n\nEjemplo: 'Proceso de venta: prospección, calificación, propuesta, cierre, seguimiento'"}
                  style={{ width: "100%", height: 180, padding: "14px 16px", border: "1.5px solid #e8e8e8", borderRadius: 12, fontSize: 14, color: "#333", resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.6, background: aiWbLoading ? "#f9f9f9" : "#fff", boxSizing: "border-box" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#6965db"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#e8e8e8"; }} />
                <div style={{ marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: "#bbb" }}>{aiWbText.length} / 8000 caracteres</span>
                </div>
              </>
            ) : (
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f?.type === "application/pdf") {
                    setAiWbPdfFile(f);
                    const pdfjsLib = await import("pdfjs-dist");
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;
                    const ab = await f.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
                    setAiWbPdfPageCount(pdf.numPages);
                  }
                }}
                style={{ display: "block", border: `2px dashed ${aiWbPdfFile ? "#6965db" : "#ddd"}`, borderRadius: 14, padding: "32px 20px", textAlign: "center", cursor: "pointer", background: aiWbPdfFile ? "#f5f3ff" : "#fafafa" }}>
                <input type="file" accept="application/pdf" style={{ display: "none" }} disabled={aiWbLoading}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setAiWbPdfFile(f);
                    const pdfjsLib = await import("pdfjs-dist");
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;
                    const ab = await f.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
                    setAiWbPdfPageCount(pdf.numPages);
                  }} />
                {aiWbPdfFile ? (
                  <>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
                    <div style={{ fontWeight: 700, color: "#6128ff", fontSize: 15 }}>{aiWbPdfFile.name}</div>
                    <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{aiWbPdfPageCount} páginas · {(aiWbPdfFile.size / 1024).toFixed(0)} KB</div>
                    {aiWbPdfPageCount > 40 && <div style={{ fontSize: 12, color: "#f59e0b", marginTop: 6, fontWeight: 600 }}>⚠️ Solo se procesarán las primeras 40 páginas</div>}
                    <button onClick={(e) => { e.preventDefault(); setAiWbPdfFile(null); setAiWbPdfPageCount(0); }}
                      style={{ marginTop: 12, background: "none", border: "1px solid #ddd", borderRadius: 8, padding: "4px 14px", fontSize: 12, color: "#888", cursor: "pointer" }}>
                      Cambiar archivo
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>📂</div>
                    <div style={{ fontWeight: 600, color: "#444", fontSize: 15 }}>Arrastrá tu PDF aquí</div>
                    <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>o hacé click para seleccionar</div>
                    <div style={{ fontSize: 12, color: "#bbb", marginTop: 8 }}>Máx. 40 páginas · PDF en español o inglés</div>
                  </>
                )}
              </label>
            )}

            {aiWbLoading && (
              <div style={{ marginTop: 16, background: "#f5f3ff", borderRadius: 12, padding: "14px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #c4b5fd", borderTopColor: "#6128ff", borderRadius: "50%", animation: "wbspin 0.7s linear infinite", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#6128ff" }}>
                      {aiWbLoadingStep === "extracting" ? "Extrayendo texto del PDF…" : "Generando pizarrón…"}
                    </div>
                    <div style={{ fontSize: 12, color: "#a78bfa", marginTop: 2 }}>
                      {aiWbLoadingStep === "extracting" ? "Leyendo páginas del documento" : "Claude AI está organizando el contenido"}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 12, height: 4, background: "#e9d5ff", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "linear-gradient(90deg,#7c4bff,#6128ff)", borderRadius: 4, width: aiWbLoadingStep === "extracting" ? "40%" : "85%", transition: "width 1s ease" }} />
                </div>
              </div>
            )}
            {aiWbError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginTop: 14, fontSize: 13, color: "#dc2626" }}>
                ⚠️ {aiWbError}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => { setShowAiWhiteboardModal(false); setAiWbPdfFile(null); setAiWbPdfPageCount(0); }} disabled={aiWbLoading}
                style={{ background: "none", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 20px", fontSize: 14, color: "#555", cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={(e) => { e.stopPropagation(); generateAiWhiteboard(); }}
                disabled={aiWbLoading || (aiWbTab === "text" ? !aiWbText.trim() : !aiWbPdfFile)}
                style={{
                  background: (aiWbLoading || (aiWbTab === "text" ? !aiWbText.trim() : !aiWbPdfFile)) ? "#c4b5fd" : "linear-gradient(135deg,#7c4bff,#6128ff)",
                  border: "none", borderRadius: 10, padding: "10px 28px", fontSize: 14,
                  color: "#fff", cursor: (aiWbLoading || (aiWbTab === "text" ? !aiWbText.trim() : !aiWbPdfFile)) ? "not-allowed" : "pointer",
                  fontWeight: 700, display: "flex", alignItems: "center", gap: 8,
                }}>
                {aiWbLoading ? "Procesando…" : "✨ Generar pizarrón"}
              </button>
            </div>
            <p style={{ margin: "12px 0 0", fontSize: 11, color: "#ccc", textAlign: "center" }}>
              Usa Claude AI · Se agregarán tarjetas al canvas actual
            </p>
          </div>
        </div>
        <style>{`@keyframes wbspin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )}
    </div>
  );
};

// ── URL helpers ───────────────────────────────────────────────────────────────

const getUrlParams = () => new URLSearchParams(window.location.search);

const navigate = (path: string) => {
  if (window.location.search !== path && window.location.pathname + window.location.search !== path) {
    window.history.pushState({}, "", path);
  }
};

// ── PasswordResetModal ────────────────────────────────────────────────────────

const PasswordResetModal = ({ onDone }: { onDone: () => void }) => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Las contraseñas no coinciden."); return; }
    if (password.length < 8) { setError("Mínimo 8 caracteres."); return; }
    setLoading(true); setError("");
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSuccess(true);
    setTimeout(onDone, 2000);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "linear-gradient(135deg,#0f0f1a,#1a0f2e)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Assistant, system-ui, sans-serif", zIndex: 9999, padding: 20,
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "40px 44px",
        width: 420, maxWidth: "100%", boxShadow: "0 24px 80px rgba(0,0,0,.4)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#1a1a2e" }}>
            Nueva contraseña
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: "#888" }}>
            Elegí una contraseña segura para tu cuenta.
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#059669", fontWeight: 700, fontSize: 16 }}>
            ✅ Contraseña actualizada. Redirigiendo…
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#444", marginBottom: 6 }}>
              Nueva contraseña
            </label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="mín. 8 caracteres" required minLength={8}
              style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e0e0f0", borderRadius: 9, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", marginBottom: 14 }}
            />
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#444", marginBottom: 6 }}>
              Repetir contraseña
            </label>
            <input
              type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="repetí la contraseña" required minLength={8}
              style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e0e0f0", borderRadius: 9, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", marginBottom: 16 }}
            />
            {error && (
              <div style={{ background: "#fff0f0", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#dc2626", marginBottom: 14 }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} style={{
              width: "100%", padding: 14, background: loading ? "#ccc" : "linear-gradient(94deg,#4a0fcc,#6128ff)",
              color: "#fff", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
            }}>
              {loading ? "Guardando…" : "Guardar nueva contraseña →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ── ExcalidrawAppInner ────────────────────────────────────────────────────────

const ExcalidrawAppInner = () => {
  const { session, loading: authLoading, passwordRecovery, clearPasswordRecovery } = useAuth();
  const [currentDrawingId, setCurrentDrawingId] = useState<string | null>(null);
  const [currentDrawingType, setCurrentDrawingType] = useState<DrawingType>("canvas");
  const [view, setView] = useState<"canvas" | "dashboard" | "admin">("canvas");
  const [initializing, setInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.has("login") || p.has("signup");
  });
  const [loginMode, setLoginMode] = useState<"login" | "signup">(() => {
    return new URLSearchParams(window.location.search).has("signup") ? "signup" : "login";
  });
  const [guestMode, setGuestMode] = useState(false);
  const [guestTool, setGuestTool] = useState<"canvas" | "mindmap" | null>(null);
  const [sharedDrawingId, setSharedDrawingId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const initDone = useRef(false);

  // Handle ?share=TOKEN — public read-only view, no auth needed
  useEffect(() => {
    const token = getUrlParams().get("share");
    if (!token) return;
    fetchSharedDrawing(token)
      .then((d) => setSharedDrawingId(d.id))
      .catch(() => {});
  }, []);

  // Listen to signup event dispatched from the guest WelcomeScreen
  useEffect(() => {
    const handler = () => setShowLogin(true);
    window.addEventListener("edudraw:signup", handler);
    return () => window.removeEventListener("edudraw:signup", handler);
  }, []);

  // Load profile + Realtime subscription for instant plan updates
  useEffect(() => {
    if (!session) return;

    fetchProfile().then((p) => {
      setProfile(p);
      if (p && !p.onboarding_done) setShowOnboarding(true);
    });

    const channel = supabase
      .channel(`profile:${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${session.user.id}`,
        },
        (payload) => {
          setProfile(payload.new as Profile);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  // Sync URL → state on browser back/forward
  useEffect(() => {
    const handler = () => {
      const params = getUrlParams();
      // No-session routes
      if (params.has("login")) { setShowLogin(true); setLoginMode("login"); return; }
      if (params.has("signup")) { setShowLogin(true); setLoginMode("signup"); return; }
      if (!params.has("d") && !params.has("admin") && !params.has("dashboard")) {
        setShowLogin(false); return; // back to landing
      }
      // Session routes
      const drawingId = params.get("d");
      const isAdmin = params.has("admin");
      if (isAdmin) { setView("admin"); return; }
      if (!drawingId) { setView("dashboard"); return; }
      setCurrentDrawingId(drawingId);
      setView("canvas");
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  // Sync state → URL for login/signup views
  useEffect(() => {
    if (session) return; // only when not logged in
    if (showLogin) {
      navigate(loginMode === "signup" ? "/?signup" : "/?login");
    } else if (!guestMode) {
      // Only clear to landing if we're not navigating to a session route
      const params = getUrlParams();
      if (params.has("login") || params.has("signup")) {
        navigate("/");
      }
    }
  }, [showLogin, loginMode, session, guestMode]);

  // Auto-load or create drawing when session is ready
  useEffect(() => {
    if (!session || currentDrawingId || initDone.current) {
      return;
    }
    initDone.current = true;

    // Restore position from URL on refresh
    const params = getUrlParams();
    const urlDrawingId = params.get("d");
    const urlAdmin = params.has("admin");

    if (urlAdmin) {
      setView("admin");
      setInitializing(false);
      return;
    }
    if (urlDrawingId) {
      setCurrentDrawingId(urlDrawingId);
      setView("canvas");
      setInitializing(false);
      fetchDrawing(urlDrawingId)
        .then((d) => setCurrentDrawingType(d?.type ?? "canvas"))
        .catch(() => {});
      return;
    }
    // Check if URL says dashboard explicitly
    if (params.has("dashboard")) {
      setView("dashboard");
      setInitializing(false);
      return;
    }

    setInitializing(true);
    fetchDrawings()
      .then(async (drawings) => {
        if (drawings.length === 0) {
          // New user — let Dashboard handle the first drawing creation
          navigate("/?dashboard");
          setView("dashboard");
          return;
        }
        const first = drawings[0];
        navigate(`/?d=${first.id}`);
        setCurrentDrawingId(first.id);
        setCurrentDrawingType(first.type ?? "canvas");
      })
      .catch(async (err) => {
        console.error("fetchDrawings error:", err);
        const msg = err?.message || err?.code || JSON.stringify(err);
        setInitError(String(msg));
        initDone.current = false;
        const isAuthError =
          err?.status === 401 ||
          err?.code === "PGRST301" ||
          String(err?.message).toLowerCase().includes("jwt");
        if (isAuthError) {
          await signOut({ scope: "local" });
        }
      })
      .finally(() => setInitializing(false));
  }, [session, currentDrawingId]);

  // Public shared drawing — anyone can view, no auth required
  if (sharedDrawingId) {
    return (
      <Provider store={appJotaiStore}>
        <ExcalidrawAPIProvider>
          <ExcalidrawWrapper
            drawingId={sharedDrawingId}
            onBackToDashboard={() => {
              setSharedDrawingId(null);
              window.history.replaceState({}, "", "/");
            }}
          />
        </ExcalidrawAPIProvider>
      </Provider>
    );
  }

  if (passwordRecovery) {
    return <PasswordResetModal onDone={clearPasswordRecovery} />;
  }

  if (authLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#6965db", fontSize: 16 }}>
        Cargando...
      </div>
    );
  }

  if (!session) {
    if (showLogin) {
      return <LoginScreen initialMode={loginMode} />;
    }
    if (guestMode) {
      const enterTool = (tool: "canvas" | "mindmap") => {
        setGuestTool(tool);
        trackGuestSessionStart(tool).catch(() => {});
      };
      const exitGuest = () => { setGuestMode(false); setGuestTool(null); };

      // ── Tool picker ──────────────────────────────────────────────────────────
      if (!guestTool) {
        return (
          <div style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "linear-gradient(135deg, #0a001f 0%, #1a0050 50%, #06060f 100%)",
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", fontFamily: "Assistant, system-ui, sans-serif",
            padding: 24,
          }}>
            <button onClick={exitGuest} style={{
              position: "absolute", top: 20, right: 20,
              background: "rgba(255,255,255,.1)", border: "none", color: "rgba(255,255,255,.6)",
              borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontFamily: "inherit",
            }}>← Volver</button>

            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(196,181,253,.15)", border: "1px solid rgba(196,181,253,.3)",
                borderRadius: 99, padding: "6px 18px", fontSize: 12, fontWeight: 700,
                color: "#c4b5fd", textTransform: "uppercase", letterSpacing: 1, marginBottom: 20,
              }}>✏️ Modo invitado · Sin registro</div>
              <h2 style={{
                fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, color: "#fff",
                margin: "0 0 12px", letterSpacing: -1, lineHeight: 1.1,
              }}>¿Qué querés probar?</h2>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,.5)", margin: 0 }}>
                Probá sin registrarte · Tus cambios no se guardan en la nube
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 640, width: "100%" }}>
              {([
                {
                  tool: "canvas" as const,
                  emoji: "🎨",
                  title: "Pizarra libre",
                  desc: "Canvas infinito para diagramas, formas, flechas y dibujo libre. Con IA para generar tarjetas visuales.",
                  color: "#7c4bff",
                  bg: "rgba(124,75,255,.12)",
                  border: "rgba(124,75,255,.35)",
                },
                {
                  tool: "mindmap" as const,
                  emoji: "🧠",
                  title: "Mapa mental",
                  desc: "Tab para hijo, Enter para hermano. Construí un mapa estructurado en segundos con IA incluida.",
                  color: "#10b981",
                  bg: "rgba(16,185,129,.12)",
                  border: "rgba(16,185,129,.35)",
                },
              ]).map(({ tool, emoji, title, desc, color, bg, border }) => (
                <button key={tool} onClick={() => enterTool(tool)} style={{
                  background: bg, border: `1.5px solid ${border}`,
                  borderRadius: 20, padding: "32px 28px", textAlign: "left",
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "transform .18s, box-shadow .18s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 48px ${bg}`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
                >
                  <div style={{ fontSize: 40, marginBottom: 16 }}>{emoji}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 8 }}>{title}</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,.55)", lineHeight: 1.6, marginBottom: 20 }}>{desc}</div>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: color, color: "#fff", borderRadius: 8,
                    padding: "8px 18px", fontSize: 14, fontWeight: 700,
                  }}>Probar {title} →</div>
                </button>
              ))}
            </div>

            <p style={{ marginTop: 32, fontSize: 13, color: "rgba(255,255,255,.3)", textAlign: "center" }}>
              ¿Ya tenés cuenta?{" "}
              <button onClick={() => { setGuestMode(false); setLoginMode("login"); setShowLogin(true); }}
                style={{ background: "none", border: "none", color: "#c4b5fd", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: 0 }}>
                Iniciá sesión →
              </button>
            </p>
          </div>
        );
      }

      // ── Active tool ──────────────────────────────────────────────────────────
      return (
        <div style={{ position: "relative", width: "100%", height: "100vh" }}>
          {/* Banner */}
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
            background: "linear-gradient(94deg, #2d0a8e, #4a0fcc, #6128ff)",
            color: "#fff", display: "flex", alignItems: "center",
            justifyContent: "space-between", padding: "0 12px",
            height: 48, fontSize: 13, fontFamily: "Assistant, sans-serif",
            boxShadow: "0 3px 16px rgba(97,40,255,.5)",
          }}>
            {/* Left: switch tool — made prominent */}
            <button onClick={() => setGuestTool(null)} style={{
              display: "flex", alignItems: "center", gap: 7,
              background: "rgba(255,255,255,.18)", border: "1.5px solid rgba(255,255,255,.45)",
              color: "#fff", borderRadius: 8, padding: "6px 14px",
              fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              transition: "background .15s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.28)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.18)"; }}
            >
              <span style={{ fontSize: 16 }}>⇄</span>
              <span>Cambiar herramienta</span>
              <span style={{
                background: guestTool === "canvas" ? "rgba(124,75,255,.5)" : "rgba(16,185,129,.5)",
                borderRadius: 4, padding: "1px 7px", fontSize: 11, fontWeight: 600, marginLeft: 2,
              }}>
                {guestTool === "canvas" ? "🎨 Pizarra" : "🧠 Mapa mental"}
              </span>
            </button>

            {/* Right: auth CTAs */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.45)", marginRight: 4 }}>Modo invitado</span>
              <button onClick={() => { setLoginMode("login"); setShowLogin(true); }}
                style={{ background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.35)", borderRadius: 6, padding: "5px 14px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                Iniciar sesión
              </button>
              <button onClick={() => { setLoginMode("signup"); setShowLogin(true); }}
                style={{ background: "#fff", color: "#6128ff", border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 800 }}>
                Crear cuenta gratis →
              </button>
              <button onClick={exitGuest}
                style={{ background: "transparent", color: "rgba(255,255,255,.45)", border: "none", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px", fontFamily: "inherit" }}
                title="Volver al inicio">×</button>
            </div>
          </div>
          <div style={{ marginTop: 44, height: "calc(100vh - 44px)" }}>
            {guestTool === "canvas" ? (
              <Provider store={appJotaiStore}>
                <ExcalidrawAPIProvider>
                  <ExcalidrawWrapper drawingId="__guest__" onBackToDashboard={exitGuest} isGuest />
                </ExcalidrawAPIProvider>
              </Provider>
            ) : (
              <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#888" }}>Cargando…</div>}>
                <MindMapEditor drawingId="__guest_mindmap__" onBack={exitGuest} isGuest />
              </Suspense>
            )}
          </div>
        </div>
      );
    }
    return (
      <LandingPage
        onLogin={() => { setLoginMode("login"); setShowLogin(true); }}
        onSignup={() => { setLoginMode("signup"); setShowLogin(true); }}
        onGuest={() => {
          setGuestMode(true);
          setGuestTool(null);
        }}
      />
    );
  }

  if (initializing) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", color: "#6965db", fontSize: 16, gap: 12 }}>
        Cargando dibujos...
        {initError && (
          <div style={{ color: "red", fontSize: 13, maxWidth: 460, textAlign: "center", background: "#fff0f0", padding: "12px 20px", borderRadius: 10, border: "1px solid #ffcccc" }}>
            {initError}
          </div>
        )}
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingForm
        onDone={() => {
          fetchProfile().then(setProfile);
          setShowOnboarding(false);
        }}
      />
    );
  }

  if (view === "admin") {
    return (
      <AdminPanel
        onBack={() => {
          navigate("/?dashboard");
          setView("dashboard");
        }}
      />
    );
  }

  if (view === "dashboard") {
    return (
      <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#6965db", fontSize: 16 }}>Cargando…</div>}>
        <Dashboard
          onOpenDrawing={async (id) => {
            navigate(`/?d=${id}`);
            setCurrentDrawingId(id);
            const d = await fetchDrawing(id).catch(() => null);
            setCurrentDrawingType(d?.type ?? "canvas");
            setView("canvas");
          }}
          profile={profile}
          onProfileChange={setProfile}
          onOpenAdmin={
            session?.user?.email === "pompa.07@gmail.com"
              ? () => { navigate("/?admin"); setView("admin"); }
              : undefined
          }
        />
      </Suspense>
    );
  }

  if (!currentDrawingId) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: 16,
          color: "#6965db",
          fontSize: 16,
        }}
      >
        {initError ? (
          <>
            <div style={{ color: "red", fontSize: 14, maxWidth: 460, textAlign: "center", background: "#fff0f0", padding: "12px 20px", borderRadius: 10, border: "1px solid #ffcccc" }}>
              Error al cargar dibujos: {initError}
            </div>
            <button
              onClick={() => { initDone.current = false; setInitError(null); setInitializing(true); fetchDrawings().then(async (drawings) => { const id = drawings.length > 0 ? drawings[0].id : (await createDrawing("Mi primer dibujo")).id; navigate(`/?d=${id}`); setCurrentDrawingId(id); }).catch((e) => setInitError(String(e?.message || e))).finally(() => setInitializing(false)); }}
              style={{ padding: "10px 24px", background: "#6965db", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}
            >
              Reintentar
            </button>
          </>
        ) : (
          <span>Cargando...</span>
        )}
      </div>
    );
  }

  const goToDashboard = () => { navigate("/?dashboard"); setView("dashboard"); };

  if (currentDrawingType === "mindmap") {
    return (
      <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#6965db", fontSize: 16 }}>Cargando mapa mental…</div>}>
        <MindMapEditor
          drawingId={currentDrawingId!}
          onBack={goToDashboard}
        />
      </Suspense>
    );
  }

  return (
    <Provider store={appJotaiStore}>
      <ExcalidrawAPIProvider>
        <ExcalidrawWrapper
          drawingId={currentDrawingId}
          onBackToDashboard={goToDashboard}
        />
      </ExcalidrawAPIProvider>
    </Provider>
  );
};

const ExcalidrawApp = () => {
  return (
    <TopErrorBoundary>
      <AuthProvider>
        <ExcalidrawAppInner />
      </AuthProvider>
    </TopErrorBoundary>
  );
};

export default ExcalidrawApp;
