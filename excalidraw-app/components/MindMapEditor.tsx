import { useEffect, useRef, useState } from "react";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  useEffect(() => {
    const handler = () => {
      const next = window.innerWidth <= 640;
      setIsMobile((prev) => (prev === next ? prev : next));
    };
    window.addEventListener("resize", handler, { passive: true });
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};
import MindElixir from "mind-elixir";
import type { MindElixirData, MindElixirInstance, Theme } from "mind-elixir";
import nodeMenu from "@mind-elixir/node-menu-neo";

import { MindMapLaser } from "./MindMapLaser";
import { MindMapShortcuts } from "./MindMapShortcuts";
import { fetchDrawing, saveDrawing, supabase } from "../data/supabase";
import { printImageAsPdf } from "../utils/pdfExport";

// ── Sticker categories ─────────────────────────────────────────────────────────

const STICKER_CATS: { label: string; icon: string; bg: string; emojis: string[] }[] = [
  {
    label: "Educación",
    icon: "📚",
    bg: "#ede9fe",
    emojis: ["📚","📖","📝","✏️","🖊️","📓","📔","📒","📕","📗","📘","📙","🎓","🏫","🏛️","🧑‍🏫","👩‍🎓","👨‍🎓","🔬","🔭","⚗️","🧪","🧬","💻","🖥️","🎒","📐","📏","📌","📍","🔍","💡","🧠","📊","📈","📉"],
  },
  {
    label: "Tareas",
    icon: "✅",
    bg: "#d1fae5",
    emojis: ["✅","☑️","✔️","❌","⭕","🎯","💯","❗","❓","⚠️","🚫","⛔","🔴","🟠","🟡","🟢","🔵","🟣","⚫","⚪","🏷️","⏱️","⏰","⌛","⏳","🛑","🔁","▶️","⏸️","🔔","📌","📍","🚦","🔒","🔓","🏁","🎌","🚩"],
  },
  {
    label: "Ideas",
    icon: "💡",
    bg: "#fef3c7",
    emojis: ["💡","🧠","🎯","🚀","⭐","🌟","✨","🔥","💥","💫","🌈","🦋","🎨","🎭","🏆","🥇","🥈","🥉","🎖️","🎗️","🎀","🎁","🎊","🎉","🎈","🎆","🪄","🎲","🎮","🕹️","🎸","🎵","🎶","🎤","🧩","💎","🌺","🌸","🌼","🌻"],
  },
  {
    label: "Ciencia",
    icon: "🔬",
    bg: "#e0f2fe",
    emojis: ["🔬","🔭","⚗️","🧪","🧫","🧬","🔋","🧲","⚙️","🔧","🛠️","⚖️","🧰","💊","🩺","🌍","🌎","🌏","🌑","🌕","🌞","🌙","🪐","☄️","🌌","🌠","🌊","🌋","❄️","☁️","⚡","🌀","🔥","🌡️","🧊","💧","🌱","🌿","☘️","🍀"],
  },
  {
    label: "Personas",
    icon: "👥",
    bg: "#fce7f3",
    emojis: ["😀","😃","😄","😁","😆","😊","😇","🥰","😍","🤩","😎","🤓","🧐","😤","😠","🤔","🤭","🤫","😴","😷","🤒","🤕","🥳","🤠","🤡","👍","👎","👏","🙌","🤝","🫶","👋","✌️","🤞","🤙","💪","🦾","🫂","👨‍💻","👩‍💻","🧑‍🏫","👨‍🎓","👩‍🎓","👶","🧒","👦","👧","🧑","👱","👨","👩","🧓","👴","👵"],
  },
  {
    label: "Objetos",
    icon: "🏠",
    bg: "#f1f5f9",
    emojis: ["🏠","🏫","🏥","🏦","🏛️","🏰","🏯","⛪","🎪","🛸","🚀","🚗","🚕","🚌","✈️","🛳️","🚂","🏍️","🚲","🛴","🛺","🏋️","⚽","🏀","🎾","🎳","🎱","🏈","⚾","🎿","🏂","🤿","🎣","🏇","🤼","🤸","⛷️","🏊","🤽","🧗","🏄"],
  },
  {
    label: "Caras",
    icon: "😊",
    bg: "#fff7ed",
    emojis: ["😀","😃","😄","😁","😆","🥹","😅","😂","🤣","☺️","😊","😇","🥰","😍","🤩","😘","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","😐","😬","🙄","😏","😒","😔","😪","😴","😷","🤒","🤕","🥵","🥶","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐","😳","🥺","😢","😭","😱","😡","😠","🤬","😈","👹","👺","👻","🤖","💀"],
  },
  {
    label: "Naturaleza",
    icon: "🌿",
    bg: "#ecfdf5",
    emojis: ["🌿","🌱","🌲","🌳","🌴","🌵","🎋","🎍","🍀","☘️","🍃","🍂","🍁","🍄","🌾","💐","🌷","🌹","🥀","🌺","🌸","🌼","🌻","🌞","🌝","🌛","🌜","🌚","🌕","🌙","⭐","🌟","💫","✨","☀️","🌤️","⛅","🌦️","🌧️","⛈️","🌩️","❄️","🌨️","🌪️","🌫️","🌈","☔","⚡","🌊","🏔️","🗻","🌋","🏝️","🦋","🐝","🐛","🦗","🌺"],
  },
  {
    label: "Tecnología",
    icon: "💻",
    bg: "#eff6ff",
    emojis: ["💻","🖥️","🖨️","⌨️","🖱️","🖲️","💽","💾","💿","📀","📱","☎️","📞","📟","📠","📺","📻","🎙️","🎚️","🎛️","🧭","⏱️","⏲️","⏰","🔋","🔌","💡","🔦","🕯️","🪔","🧲","🔧","🔨","⚙️","🛠️","🔩","🪛","🔑","🗝️","🔐","🔒","🔓","🔏","📡","🛰️","🚀","🤖","👾","🕹️","🎮","📲","💬","📧","🌐","🔗","💻","🖥"],
  },
  {
    label: "Comida",
    icon: "🍕",
    bg: "#fff1f2",
    emojis: ["🍕","🍔","🌮","🌯","🥗","🍜","🍝","🍛","🍱","🍣","🍤","🍗","🥩","🥚","🍳","🥞","🧇","🥓","🥐","🍞","🥖","🧀","🥨","🥯","🍦","🍧","🍨","🍩","🍪","🎂","🍰","🧁","🍫","🍬","🍭","🍮","🍯","🍷","🍸","🍹","🧃","🥤","☕","🍵","🧋","🥛","🍺","🍻","🧊","🫖","🥂","🍾","🥃"],
  },
  {
    label: "Animales",
    icon: "🐶",
    bg: "#fdf4ff",
    emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🦟","🦗","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐟","🐠","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🦙","🐏","🐑","🦌","🐕","🐩","🦮"],
  },
  {
    label: "Viajes",
    icon: "✈️",
    bg: "#f0f9ff",
    emojis: ["✈️","🚀","🛸","🚁","🛩️","🚂","🚃","🚄","🚅","🚆","🚇","🚈","🚉","🚊","🚝","🚞","🚋","🚌","🚍","🚎","🚐","🚑","🚒","🚓","🚔","🚕","🚖","🚗","🚘","🚙","🛻","🚚","🚛","🚜","🏎️","🏍️","🛵","🚲","🛴","🛹","🛼","🚏","🛣️","🗺️","🧭","🗼","🗽","⛪","🕌","🛕","🕍","⛩️","🏯","🏰","⛺","🏕️","🌅","🌄","🌠","🎇","🎆","🌇","🌆","🏙️","🌃","🌉","🌌","🌁","🗾","🏔️","⛰️","🌋","🗻","🏕️","🏖️","🏜️","🏝️","🏞️"],
  },
];

// ── Themes ─────────────────────────────────────────────────────────────────────

const THEME_DEFAULT: Theme = {
  name: "Predeterminado",
  type: "light",
  palette: ["#6965db", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"],
  cssVar: {
    "--main-color": "#333",
    "--main-bgcolor": "#f0efff",
    "--color": "#454545",
    "--bgcolor": "#fff",
    "--root-color": "#fff",
    "--root-bgcolor": "#6965db",
    "--root-border-color": "#5551c4",
    "--panel-color": "#444",
    "--panel-bgcolor": "#fff",
    "--panel-border-color": "#e0e0e0",
  },
};

const THEME_DARK: Theme = {
  name: "Oscuro",
  type: "dark",
  palette: ["#848FA0", "#748BE9", "#D2F5A6", "#F39C12", "#E74C3C", "#9B59B6"],
  cssVar: {
    "--main-color": "#fff",
    "--main-bgcolor": "#3a3a4a",
    "--color": "#ccc",
    "--bgcolor": "#1e1e2e",
    "--root-color": "#fff",
    "--root-bgcolor": "#6965db",
    "--root-border-color": "#5551c4",
    "--panel-color": "#ccc",
    "--panel-bgcolor": "#2a2a3a",
    "--panel-border-color": "#444",
  },
};

const THEME_FRESH: Theme = {
  name: "Natural",
  type: "light",
  palette: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"],
  cssVar: {
    "--main-color": "#1a3a2a",
    "--main-bgcolor": "#d1fae5",
    "--color": "#374151",
    "--bgcolor": "#f0fdf4",
    "--root-color": "#fff",
    "--root-bgcolor": "#10b981",
    "--root-border-color": "#059669",
    "--panel-color": "#374151",
    "--panel-bgcolor": "#fff",
    "--panel-border-color": "#d1fae5",
  },
};

const THEME_WARM: Theme = {
  name: "Cálido",
  type: "light",
  palette: ["#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#3b82f6", "#10b981"],
  cssVar: {
    "--main-color": "#78350f",
    "--main-bgcolor": "#fef3c7",
    "--color": "#374151",
    "--bgcolor": "#fffbeb",
    "--root-color": "#fff",
    "--root-bgcolor": "#f59e0b",
    "--root-border-color": "#d97706",
    "--panel-color": "#374151",
    "--panel-bgcolor": "#fff",
    "--panel-border-color": "#fde68a",
  },
};

const THEMES = [THEME_DEFAULT, THEME_DARK, THEME_FRESH, THEME_WARM];

// ── Templates ──────────────────────────────────────────────────────────────────

const n = (topic: string, children: any[] = []) => ({ topic, id: Math.random().toString(36).slice(2), children });

const MIND_TEMPLATES: { name: string; icon: string; desc: string; data: MindElixirData }[] = [
  {
    name: "Brainstorming",
    icon: "💡",
    desc: "Lluvia de ideas libre",
    data: {
      nodeData: { ...n("Tema central", [
        n("Idea 1", [n("Detalle"), n("Detalle")]),
        n("Idea 2", [n("Detalle"), n("Detalle")]),
        n("Idea 3", [n("Detalle")]),
        n("Idea 4"),
      ]), id: "root" },
    } as any,
  },
  {
    name: "FODA / SWOT",
    icon: "📊",
    desc: "Fortalezas, oportunidades, debilidades y amenazas",
    data: {
      nodeData: { ...n("Mi proyecto", [
        n("🟢 Fortalezas", [n("Fortaleza 1"), n("Fortaleza 2")]),
        n("🔵 Oportunidades", [n("Oportunidad 1"), n("Oportunidad 2")]),
        n("🔴 Debilidades", [n("Debilidad 1"), n("Debilidad 2")]),
        n("🟡 Amenazas", [n("Amenaza 1"), n("Amenaza 2")]),
      ]), id: "root" },
    } as any,
  },
  {
    name: "Plan de proyecto",
    icon: "🗂️",
    desc: "Fases y tareas de un proyecto",
    data: {
      nodeData: { ...n("Proyecto", [
        n("📋 Planificación", [n("Objetivos"), n("Recursos"), n("Cronograma")]),
        n("⚙️ Ejecución", [n("Tarea 1"), n("Tarea 2"), n("Tarea 3")]),
        n("✅ Cierre", [n("Revisión"), n("Entrega")]),
      ]), id: "root" },
    } as any,
  },
  {
    name: "Clase / Lección",
    icon: "🎓",
    desc: "Estructura de una clase o unidad didáctica",
    data: {
      nodeData: { ...n("Tema de la clase", [
        n("🎯 Objetivos", [n("Objetivo 1"), n("Objetivo 2")]),
        n("📖 Contenidos", [n("Concepto A"), n("Concepto B"), n("Concepto C")]),
        n("🛠️ Actividades", [n("Actividad 1"), n("Actividad 2")]),
        n("📝 Evaluación", [n("Criterio 1"), n("Criterio 2")]),
      ]), id: "root" },
    } as any,
  },
  {
    name: "Resolución de problema",
    icon: "🔍",
    desc: "Análisis de causa y solución",
    data: {
      nodeData: { ...n("Problema", [
        n("🔎 Causas", [n("Causa 1"), n("Causa 2"), n("Causa 3")]),
        n("💥 Efectos", [n("Efecto 1"), n("Efecto 2")]),
        n("💡 Soluciones", [n("Solución 1"), n("Solución 2")]),
        n("✅ Plan de acción", [n("Paso 1"), n("Paso 2")]),
      ]), id: "root" },
    } as any,
  },
  {
    name: "En blanco",
    icon: "⬜",
    desc: "Empezá desde cero",
    data: { nodeData: { ...n("Mi idea central"), id: "root" } } as any,
  },
];


// ── Component ──────────────────────────────────────────────────────────────────

export const MindMapEditor = ({
  drawingId,
  onBack,
  isGuest = false,
}: {
  drawingId: string;
  onBack: () => void;
  isGuest?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const meRef = useRef<MindElixirInstance | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = useIsMobile();

  const [drawingName, setDrawingName] = useState("Sin título");
  const [editingName, setEditingName] = useState(false);
  const [activeTheme, setActiveTheme] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [stickerCatIdx, setStickerCatIdx] = useState(0);
  const [stickerMsg, setStickerMsg] = useState<string | null>(null);
  const [stickerAtEnd, setStickerAtEnd] = useState(false);
  const [laserMode, setLaserMode] = useState(false);
  const laserModeRef = useRef(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Custom style panel
  const [stylePanel, setStylePanel] = useState(false);
  const [nodeColor, setNodeColor] = useState("");
  const [nodeBg, setNodeBg] = useState("");
  const [nodeBold, setNodeBold] = useState(false);
  const [nodeItalic, setNodeItalic] = useState(false);
  const [nodeFontSize, setNodeFontSize] = useState("");

  const [activeLayout, setActiveLayout] = useState(0); // 0=SIDE 1=RIGHT 2=LEFT
  const [zoomPct, setZoomPct] = useState(100);
  const [dragSide, setDragSide] = useState<"left" | "right" | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTab, setAiTab] = useState<"text" | "pdf">("text");
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLoadingStep, setAiLoadingStep] = useState<"extracting" | "generating" | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState<number>(0);
  const [aiError, setAiError] = useState<string | null>(null);

  const GUEST_MINDMAP_KEY = "edudraw_guest_mindmap";

  const scheduleSave = (themeIdx?: number) => {
    if (!meRef.current) return;
    if (isGuest) {
      // Persist guest mindmap in localStorage so returning visitors keep their work
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const data = meRef.current!.getData();
        localStorage.setItem(GUEST_MINDMAP_KEY, JSON.stringify({
          mindElixir: data,
          themeIdx: themeIdx ?? activeThemeRef.current,
          layoutIdx: activeLayoutRef.current,
        }));
      }, 1500);
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const data = meRef.current!.getData();
      saveDrawing(drawingId, {
        mindElixir: data,
        themeIdx: themeIdx ?? activeThemeRef.current,
        layoutIdx: activeLayoutRef.current,
      } as any);
    }, 1500);
  };

  const activeThemeRef = useRef(0);
  const activeLayoutRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current || meRef.current) return;

    const me = new MindElixir({
      el: containerRef.current,
      direction: MindElixir.SIDE,
      locale: "es",
      draggable: true,
      editable: true,
      contextMenu: true,
      toolBar: true,
      keypress: true,
      allowUndo: true,
      theme: THEME_DEFAULT,
      newTopicName: "Nuevo nodo",
      mouseSelectionButton: 2, // left-drag pans canvas; right-drag for multi-select
    });

    me.install(nodeMenu);
    meRef.current = me;

    // Sync zoom percentage to state — debounced so pinch-zoom on mobile doesn't flood re-renders
    let scaleTimer: ReturnType<typeof setTimeout> | null = null;
    me.bus.addListener("scale", (val: number) => {
      if (scaleTimer) clearTimeout(scaleTimer);
      scaleTimer = setTimeout(() => {
        scaleTimer = null;
        setZoomPct(Math.round(val * 100));
      }, 60);
    });

    if (isGuest) {
      const saved = localStorage.getItem(GUEST_MINDMAP_KEY);
      if (saved) {
        try {
          const content = JSON.parse(saved);
          me.init(content.mindElixir ?? MindElixir.new("Mi idea central"));
          const savedIdx = content.themeIdx ?? 0;
          if (savedIdx !== 0) {
            setActiveTheme(savedIdx);
            activeThemeRef.current = savedIdx;
            me.changeTheme(THEMES[savedIdx], true);
          }
          const savedLayout = content.layoutIdx ?? 0;
          if (savedLayout !== 0) {
            setActiveLayout(savedLayout);
            const layoutMethods = [(me as any).initSide, (me as any).initRight, (me as any).initLeft];
            layoutMethods[savedLayout]?.call(me);
          }
        } catch {
          me.init(MindElixir.new("Mi idea central"));
          setShowTemplates(true);
        }
      } else {
        me.init(MindElixir.new("Mi idea central"));
        setShowTemplates(true);
      }
      setLoaded(true);
    } else {
      fetchDrawing(drawingId).then((d) => {
        setDrawingName(d.name);
        const content = d.content as any;
        const isNew = !content?.mindElixir;
        const data: MindElixirData =
          content?.mindElixir ?? MindElixir.new(d.name || "Mi idea central");
        me.init(data);
        if (isNew) setShowTemplates(true);

        // Restore saved theme
        const savedIdx = content?.themeIdx ?? 0;
        if (savedIdx !== 0) {
          setActiveTheme(savedIdx);
          activeThemeRef.current = savedIdx;
          me.changeTheme(THEMES[savedIdx], true);
        }

        // Restore saved layout
        const savedLayout = content?.layoutIdx ?? 0;
        if (savedLayout !== 0) {
          setActiveLayout(savedLayout);
          const layoutMethods = [(me as any).initSide, (me as any).initRight, (me as any).initLeft];
          layoutMethods[savedLayout]?.call(me);
        }

        setLoaded(true);
      });
    }

    let operationJustFired = false;
    let draggingTopNodeId: string | null = null;

    me.bus.addListener("operation", (op: any) => {
      // After drag in SIDE mode, sync node direction with DOM (.lhs vs .rhs)
      // Mind Elixir moves nodes in DOM correctly but doesn't update direction property
      if (
        activeLayoutRef.current === 0 &&
        (op?.name === "moveNodeBefore" || op?.name === "moveNodeAfter" || op?.name === "moveNodeIn")
      ) {
        operationJustFired = true;
        setTimeout(() => { operationJustFired = false; }, 150);
        requestAnimationFrame(() => {
          if (!containerRef.current) return;
          const meInst = meRef.current as any;
          const children: any[] = meInst?.nodeData?.children ?? [];
          children.forEach((child: any) => {
            const tpcEl = containerRef.current!.querySelector(`[data-nodeid="me${child.id}"]`);
            if (!tpcEl) return;
            child.direction = tpcEl.closest(".lhs") ? 0 : 1;
          });
        });
      }
      scheduleSave();
    });

    // When one side is empty, dragend to the empty side flips node direction
    const mapEl = containerRef.current?.querySelector(".map-container");

    const getRootCenterX = () => {
      const rootTpc = mapEl?.querySelector("me-root me-tpc") as HTMLElement | null;
      if (!rootTpc) return null;
      const r = rootTpc.getBoundingClientRect();
      return r.left + r.width / 2;
    };

    const onDragStart = (e: Event) => {
      const tpc = (e.target as Element).closest("me-tpc") as HTMLElement | null;
      draggingTopNodeId = tpc?.dataset?.nodeid?.replace(/^me/, "") ?? null;
      if (draggingTopNodeId && activeLayoutRef.current === 0) {
        const cx = getRootCenterX();
        if (cx != null) {
          const de = e as DragEvent;
          setDragSide((de.clientX ?? 0) < cx ? "left" : "right");
        }
      }
    };

    const onDragOver = (e: Event) => {
      if (!draggingTopNodeId || activeLayoutRef.current !== 0) return;
      const cx = getRootCenterX();
      if (cx == null) return;
      setDragSide((e as DragEvent).clientX < cx ? "left" : "right");
    };

    const onDragEnd = (e: DragEvent) => {
      setDragSide(null);
      const id = draggingTopNodeId;
      draggingTopNodeId = null;
      if (!id || activeLayoutRef.current !== 0 || operationJustFired) return;
      const cx = getRootCenterX();
      if (cx == null) return;
      const meInst = meRef.current as any;
      const child = (meInst?.nodeData?.children ?? []).find((c: any) => c.id === id);
      if (!child) return;
      const mouseOnLeft = e.clientX < cx;
      const nodeOnLeft = child.direction === 0;
      if (mouseOnLeft !== nodeOnLeft) {
        const data = JSON.parse(JSON.stringify(meInst.getData())) as any;
        data.direction = 2;
        const topChild = data.nodeData.children.find((c: any) => c.id === id);
        if (topChild) {
          topChild.direction = mouseOnLeft ? 0 : 1;
          meInst.init(data);
          scheduleSave();
        }
      }
    };

    if (mapEl) {
      mapEl.addEventListener("dragstart", onDragStart);
      mapEl.addEventListener("dragover", onDragOver);
      mapEl.addEventListener("dragend", onDragEnd as EventListener);
    }

    return () => {
      // (no keydown listeners to clean up here)
      const el = containerRef.current?.querySelector(".map-container");
      if (el) {
        el.removeEventListener("dragstart", onDragStart as any);
        el.removeEventListener("dragover", onDragOver as any);
        el.removeEventListener("dragend", onDragEnd as any);
      }
    };
  }, [drawingId]);

  const applyTheme = (idx: number) => {
    setActiveTheme(idx);
    activeThemeRef.current = idx;
    meRef.current?.changeTheme(THEMES[idx], true);
    scheduleSave(idx);
  };

  // DOM observer: hide Tag/Icon/URL from node-menu-neo + render center stickers
  useEffect(() => {
    const hideMenuFields = () => {
      const menu = document.querySelector(".mind-elixir-node-menu");
      if (!menu) return;

      // 1. Hide the "Sticker" tab button AND its tab content panel
      menu.querySelectorAll<HTMLElement>("button").forEach((btn) => {
        if (btn.textContent?.trim() === "Sticker") {
          btn.style.display = "none";
          // If Sticker tab is currently active, click Style tab to switch back
          if (btn.classList.contains("active") || btn.getAttribute("aria-selected") === "true") {
            const styleBtn = Array.from(menu.querySelectorAll<HTMLElement>("button"))
              .find((b) => b.textContent?.trim() === "Style");
            styleBtn?.click();
          }
        }
      });
      // Also hide any sticker grid content that might be visible
      menu.querySelectorAll<HTMLElement>("[class*='sticker'], [class*='emoji-grid']").forEach((el) => {
        el.style.display = "none";
      });

      // 2. Hide Tag, Icon, URL labels (plain <p>) and their following input sibling
      menu.querySelectorAll<HTMLElement>("p").forEach((p) => {
        const txt = p.textContent?.trim() ?? "";
        if (txt === "Tag" || txt === "Icon" || txt === "URL") {
          p.style.display = "none";
          const next = p.nextElementSibling as HTMLElement | null;
          if (next && (next.tagName === "INPUT" || next.tagName === "TEXTAREA")) {
            next.style.display = "none";
          }
        }
      });

      // 3. Hide by known plugin class names
      menu.querySelectorAll<HTMLElement>(".nm-icon, .nm-url").forEach((el) => {
        el.style.display = "none";
        const prev = el.previousElementSibling as HTMLElement | null;
        if (prev?.tagName === "P") prev.style.display = "none";
      });
    };

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const observer = new MutationObserver(() => {
      if (debounceTimer) return;
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        hideMenuFields();
      }, 80);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    hideMenuFields();
    return () => {
      observer.disconnect();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "l" || e.key === "L") {
        const next = !laserModeRef.current;
        laserModeRef.current = next;
        setLaserMode(next);
      }
      if (e.key === "?") {
        setShowShortcuts((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Sync custom style panel with selected node
  useEffect(() => {
    if (!loaded) return;
    const me = meRef.current as any;
    if (!me) return;
    const onSelect = (nodeObj: any) => {
      const style = nodeObj?.style ?? {};
      setNodeColor(style.color ?? "");
      setNodeBg(style.background ?? "");
      setNodeBold(style.fontWeight === "bold");
      setNodeItalic(style.fontStyle === "italic");
      setNodeFontSize(style.fontSize ?? "");
      setStylePanel(true);
    };
    const onUnselect = () => setStylePanel(false);
    me.bus.addListener("selectNode", onSelect);
    me.bus.addListener("unselectNode", onUnselect);
    return () => {
      me.bus.removeListener?.("selectNode", onSelect);
      me.bus.removeListener?.("unselectNode", onUnselect);
    };
  }, [loaded]);

  const applyNodeStyle = (updates: Record<string, string>) => {
    const me = meRef.current as any;
    if (!me?.currentNode) return;
    const tpc = me.currentNode as HTMLElement;
    const nodeObj = (tpc as any).nodeObj;
    if (!nodeObj) return;
    nodeObj.style = { ...(nodeObj.style ?? {}), ...updates };
    // Apply visually to the DOM element
    Object.entries(updates).forEach(([k, v]) => {
      if (k === "color") tpc.style.color = v;
      if (k === "background") tpc.style.background = v;
      if (k === "fontWeight") tpc.style.fontWeight = v;
      if (k === "fontStyle") tpc.style.fontStyle = v;
      if (k === "fontSize") tpc.style.fontSize = v;
    });
    me.bus.fire?.("operation", { name: "finishedEdit" });
    scheduleSave();
  };

  const toggleLaser = () => {
    const next = !laserModeRef.current;
    laserModeRef.current = next;
    setLaserMode(next);
  };

  // Layout switching — methods confirmed in mind-elixir type definitions
  const LAYOUTS = [
    { label: "Ambos lados", icon: "⬡", apply: (me: any) => me.initSide() },
    { label: "Derecha", icon: "▶", apply: (me: any) => me.initRight() },
    { label: "Izquierda", icon: "◀", apply: (me: any) => me.initLeft() },
  ];

  const applyLayout = (idx: number) => {
    const me = meRef.current as any;
    if (!me) return;

    if (idx === 0) {
      // getData() includes direction:currentDirection; init() reads it back and overrides
      // me.direction — so we must set direction=2 (SIDE) inside the data object itself.
      const data = JSON.parse(JSON.stringify(me.getData())) as any;
      data.direction = 2; // SIDE — init() reads this and sets me.direction
      const children = (data?.nodeData?.children ?? []) as any[];
      children.forEach((child: any, i: number) => {
        child.direction = i % 2 === 0 ? 1 : 0; // even → RIGHT(1), odd → LEFT(0)
      });
      me.init(data);
    } else if (idx === 1) {
      me.initRight();
    } else {
      me.initLeft();
    }

    setActiveLayout(idx);
    activeLayoutRef.current = idx;
    scheduleSave();
  };

  const extractPdfText = async (file: File, maxPages = 40): Promise<string> => {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = Math.min(pdf.numPages, maxPages);
    const texts: string[] = [];
    for (let i = 1; i <= pages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      texts.push(content.items.map((item: any) => item.str).join(" "));
    }
    return texts.join("\n");
  };

  const generateFromAI = async () => {
    if (aiTab === "text" && !aiText.trim()) return;
    if (aiTab === "pdf" && !pdfFile) return;
    if (!meRef.current) return;
    setAiLoading(true);
    setAiError(null);
    try {
      let text = aiText;
      if (aiTab === "pdf" && pdfFile) {
        setAiLoadingStep("extracting");
        text = await extractPdfText(pdfFile);
        if (!text.trim()) throw new Error("No se pudo extraer texto del PDF.");
      }
      setAiLoadingStep("generating");
      const { data, error } = await supabase.functions.invoke("ai-mindmap", {
        body: { text },
      });
      if (error) throw new Error(error.message);
      meRef.current.init(data as MindElixirData);
      setShowAiModal(false);
      setAiText("");
      setPdfFile(null);
      setPdfPageCount(0);
      scheduleSave();
    } catch (err: any) {
      setAiError(err?.message ?? "No se pudo generar el mapa. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setAiLoading(false);
      setAiLoadingStep(null);
    }
  };

  const applyTemplate = (data: MindElixirData) => {
    meRef.current?.init(data);
    setShowTemplates(false);
    scheduleSave();
  };

  const insertSticker = async (emoji: string) => {
    const me = meRef.current;
    if (!me?.currentNode) {
      setStickerMsg("⚠️ Seleccioná un nodo primero");
      setTimeout(() => setStickerMsg(null), 2000);
      return;
    }
    const currentNode = me.currentNode;
    const nodeObj = (currentNode as any).nodeObj as { topic: string } | undefined;
    if (!nodeObj) return;

    const newTopic = stickerAtEnd
      ? `${nodeObj.topic} ${emoji}`
      : `${emoji} ${nodeObj.topic}`;

    await (me as any).setNodeTopic(currentNode, newTopic);
    // Immediately update DOM so the change is visible without waiting for a re-render
    const tpc = currentNode as HTMLElement;
    tpc.textContent = newTopic;

    scheduleSave();
    setStickerMsg(`${emoji} agregado`);
    setTimeout(() => setStickerMsg(null), 1500);
  };

  const commitName = (val: string) => {
    const name = val.trim() || "Sin título";
    setDrawingName(name);
    setEditingName(false);
    if (isGuest) return;
    const data = meRef.current?.getData();
    if (data) saveDrawing(drawingId, { mindElixir: data } as any);
  };

  const handleExportPng = async () => {
    if (!meRef.current) return;
    const blob = await meRef.current.exportPng();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${drawingName}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    if (!meRef.current) return;
    const blob = await meRef.current.exportPng();
    if (!blob) return;
    const reader = new FileReader();
    reader.onload = () => printImageAsPdf(reader.result as string, drawingName);
    reader.readAsDataURL(blob);
  };

  const handleExport = () => {
    if (!meRef.current) return;
    const blob = meRef.current.exportSvg();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${drawingName}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column" }}>

      {/* Top bar */}
      <div style={{
        height: isMobile ? "auto" : 50,
        minHeight: 50,
        background: "#fff", borderBottom: "1px solid #e8e8f0",
        display: "flex", alignItems: "center", padding: "0 8px", gap: 6,
        flexShrink: 0, zIndex: 10,
        overflowX: isMobile ? "auto" : "visible",
        flexWrap: isMobile ? "nowrap" : "nowrap",
        WebkitOverflowScrolling: "touch" as any,
      }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#6965db", fontSize: 22, padding: "4px 8px" }}>←</button>

        {editingName ? (
          <input
            autoFocus
            defaultValue={drawingName}
            onBlur={(e) => commitName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commitName((e.target as HTMLInputElement).value); }}
            style={{ fontSize: 14, fontWeight: 600, border: "1px solid #6965db", borderRadius: 6, padding: "3px 8px", outline: "none", minWidth: 180 }}
          />
        ) : (
          <span onDoubleClick={() => setEditingName(true)} title="Doble click para renombrar"
            style={{ fontSize: 14, fontWeight: 600, color: "#333", cursor: "text", flex: 1 }}>
            🧠 {drawingName}
          </span>
        )}

        {/* Layout picker */}
        <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
          {!isMobile && <span style={{ fontSize: 11, color: "#aaa" }}>Estructura:</span>}
          {LAYOUTS.map((l, i) => (
            <button
              key={l.label}
              onClick={() => applyLayout(i)}
              title={l.label}
              style={{
                padding: isMobile ? "6px 8px" : "4px 10px",
                fontSize: 12, borderRadius: 6, cursor: "pointer",
                border: activeLayout === i ? "2px solid #6965db" : "1px solid #e0e0e0",
                background: activeLayout === i ? "#f0efff" : "#fff",
                color: activeLayout === i ? "#6965db" : "#555",
                fontWeight: activeLayout === i ? 700 : 400,
                transition: "all 0.12s", whiteSpace: "nowrap",
                minHeight: 36,
              }}
            >
              {isMobile ? l.icon : `${l.icon} ${l.label}`}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 24, background: "#e8e8f0", flexShrink: 0 }} />

        {/* Theme picker */}
        <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
          {!isMobile && <span style={{ fontSize: 11, color: "#aaa" }}>Estilo:</span>}
          {THEMES.map((t, i) => (
            <button
              key={t.name}
              onClick={() => applyTheme(i)}
              title={t.name}
              style={{
                padding: isMobile ? "6px 8px" : "4px 10px",
                fontSize: 12, borderRadius: 6, cursor: "pointer",
                border: activeTheme === i ? "2px solid #6965db" : "1px solid #e0e0e0",
                background: activeTheme === i ? "#f0efff" : "#fff",
                color: activeTheme === i ? "#6965db" : "#555",
                fontWeight: activeTheme === i ? 600 : 400,
                transition: "all 0.12s", whiteSpace: "nowrap",
                minHeight: 36,
              }}
            >
              {isMobile ? t.name.slice(0, 3) : t.name}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowTemplates(true)}
          style={{ background: "none", border: "1px solid #e0e0e0", borderRadius: 6, padding: isMobile ? "6px 8px" : "5px 12px", fontSize: 12, color: "#555", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, minHeight: 36 }}
        >
          {isMobile ? "📋" : "📋 Plantillas"}
        </button>

        <button
          onClick={() => { setShowAiModal(true); setAiError(null); }}
          title="Generar mapa mental con IA desde texto"
          style={{
            background: "linear-gradient(135deg,#7c4bff,#6128ff)",
            border: "none", borderRadius: 6, padding: isMobile ? "6px 8px" : "5px 13px", fontSize: 12,
            color: "#fff", cursor: "pointer", fontWeight: 600,
            boxShadow: "0 2px 8px rgba(97,40,255,.3)", whiteSpace: "nowrap", flexShrink: 0, minHeight: 36,
          }}
        >
          {isMobile ? "✨" : "✨ Generar con IA"}
        </button>

        <button
          onClick={() => setShowStickerPicker(v => !v)}
          title="Agregar sticker/emoji al nodo seleccionado"
          style={{
            background: showStickerPicker ? "#f0efff" : "none",
            border: `1px solid ${showStickerPicker ? "#6965db" : "#e0e0e0"}`,
            borderRadius: 6, padding: isMobile ? "6px 8px" : "5px 12px", fontSize: 12,
            color: showStickerPicker ? "#6965db" : "#555", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, minHeight: 36,
          }}
        >
          {isMobile ? "🎨" : "🎨 Stickers"}
        </button>

        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button onClick={handleExport} style={{ background: "none", border: "1px solid #e0e0e0", borderRadius: "6px 0 0 6px", padding: "5px 10px", fontSize: 12, color: "#555", cursor: "pointer", borderRight: "none", minHeight: 36 }}>
            SVG
          </button>
          <button onClick={handleExportPng} style={{ background: "none", border: "1px solid #e0e0e0", borderRadius: "0", padding: "5px 10px", fontSize: 12, color: "#555", cursor: "pointer", borderLeft: "none", minHeight: 36 }}>
            PNG
          </button>
          <button onClick={handleExportPdf} style={{ background: "none", border: "1px solid #e0e0e0", borderRadius: "0 6px 6px 0", padding: "5px 10px", fontSize: 12, color: "#e05c00", fontWeight: 600, cursor: "pointer", borderLeft: "none", minHeight: 36 }}>
            PDF
          </button>
        </div>

        {loaded && <span style={{ fontSize: 11, color: "#bbb", flexShrink: 0 }}>💾 Guardado automático</span>}
      </div>

      {/* Tips banner */}
      {showTips && (
        <div style={{
          background: "#f0efff", borderBottom: "1px solid #dddaff",
          padding: "7px 14px", display: "flex", alignItems: "center", gap: 8,
          flexShrink: 0, flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6965db", flexShrink: 0 }}>💡 Atajos rápidos</span>
          {[
            { key: "Tab", desc: "nodo hijo" },
            { key: "Enter", desc: "nodo hermano" },
            { key: "Delete", desc: "eliminar" },
            { key: "Doble clic", desc: "editar texto" },
            { key: "Arrastrar fondo", desc: "mover canvas" },
            { key: "Arrastrar nodo", desc: "reordenar" },
            { key: "Click derecho", desc: "más opciones" },
          ].map(({ key, desc }) => (
            <span key={key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#555" }}>
              <kbd style={{
                background: "#fff", border: "1px solid #c8c4f0", borderRadius: 5,
                padding: "1px 6px", fontSize: 10, fontWeight: 700, color: "#4a47a3",
                fontFamily: "inherit", boxShadow: "0 1px 0 #c8c4f0",
              }}>{key}</kbd>
              <span style={{ color: "#888" }}>{desc}</span>
            </span>
          ))}
          <button
            onClick={() => setShowTips(false)}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 15, padding: "0 2px", lineHeight: 1 }}
          >✕</button>
        </div>
      )}

      {/* Sticker picker panel */}
      {showStickerPicker && (
        <div style={{ background: "#fff", borderBottom: "1px solid #e8e8f0", flexShrink: 0, boxShadow: "0 4px 20px rgba(0,0,0,.1)" }}>
          {/* Header row: category pills + placement toggle + close */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderBottom: "1px solid #f0f0f8", overflowX: "auto" }}>
            {STICKER_CATS.map((cat, i) => (
              <button
                key={cat.label}
                onClick={() => setStickerCatIdx(i)}
                style={{
                  display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
                  background: stickerCatIdx === i ? "#6965db" : cat.bg,
                  border: "none", borderRadius: 20, padding: "5px 12px",
                  fontSize: 12, fontWeight: stickerCatIdx === i ? 700 : 500,
                  color: stickerCatIdx === i ? "#fff" : "#444",
                  cursor: "pointer",
                }}
              >
                <span>{cat.icon}</span> {cat.label}
              </button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {/* Placement toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#f5f4ff", borderRadius: 8, padding: "3px 4px" }}>
                <button
                  onClick={() => setStickerAtEnd(false)}
                  title="Agregar al inicio del texto"
                  style={{ background: !stickerAtEnd ? "#6965db" : "none", color: !stickerAtEnd ? "#fff" : "#888", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                >
                  ← Inicio
                </button>
                <button
                  onClick={() => setStickerAtEnd(true)}
                  title="Agregar al final del texto"
                  style={{ background: stickerAtEnd ? "#6965db" : "none", color: stickerAtEnd ? "#fff" : "#888", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                >
                  Final →
                </button>
              </div>
              {stickerMsg && (
                <span style={{ fontSize: 12, color: "#6965db", fontWeight: 700, background: "#f0efff", padding: "2px 8px", borderRadius: 6 }}>{stickerMsg}</span>
              )}
              <button onClick={() => setShowStickerPicker(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 18, padding: "0 4px", lineHeight: 1 }}>✕</button>
            </div>
          </div>

          {/* Sticker grid */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "10px 14px", maxHeight: 180, overflowY: "auto", background: STICKER_CATS[stickerCatIdx].bg + "44" }}>
            {STICKER_CATS[stickerCatIdx].emojis.map((em) => (
              <button
                key={em}
                onClick={() => insertSticker(em)}
                title={`Agregar ${em} al nodo`}
                style={{
                  background: "#fff", border: `2px solid ${STICKER_CATS[stickerCatIdx].bg}`,
                  borderRadius: 12, padding: "6px 8px",
                  fontSize: 26, cursor: "pointer", lineHeight: 1,
                  boxShadow: "0 2px 6px rgba(0,0,0,.08)",
                  transition: "transform .1s, box-shadow .1s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "scale(1.18)";
                  el.style.boxShadow = "0 4px 14px rgba(105,101,219,.3)";
                  el.style.borderColor = "#6965db";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "scale(1)";
                  el.style.boxShadow = "0 2px 6px rgba(0,0,0,.08)";
                  el.style.borderColor = STICKER_CATS[stickerCatIdx].bg;
                }}
              >
                {em}
              </button>
            ))}
          </div>

          <div style={{ padding: "4px 14px 8px", fontSize: 11, color: "#aaa", display: "flex", alignItems: "center", gap: 6 }}>
            <span>💡 Seleccioná un nodo → elegí un sticker → se agrega en tiempo real</span>
          </div>
        </div>
      )}

      {/* Mind map canvas */}
      <div
        ref={containerRef}
        style={{ flex: 1, overflow: "hidden", position: "relative" }}
      >
        <MindMapLaser active={laserMode} containerRef={containerRef} />
        {/* Drop zone overlay — shown in SIDE mode while dragging */}
        {dragSide && (
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            display: "flex", zIndex: 10,
          }}>
            {(["left", "right"] as const).map((side) => (
              <div key={side} style={{
                flex: 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: dragSide === side
                  ? "rgba(105,101,219,0.15)"
                  : "rgba(105,101,219,0.04)",
                border: dragSide === side
                  ? `2px dashed #6965db`
                  : "2px dashed transparent",
                borderRadius: 12,
                margin: 8,
                transition: "all 0.15s ease",
              }}>
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  color: dragSide === side ? "#6965db" : "rgba(105,101,219,0.3)",
                  opacity: dragSide === side ? 1 : 0.4,
                  transition: "all 0.15s ease",
                  userSelect: "none",
                }}>
                  {side === "left" ? "← Soltar aquí" : "Soltar aquí →"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating navigation toolbar */}
      {loaded && (
        <div style={{
          position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: 2,
          background: "#fff", borderRadius: 12,
          border: "1px solid #e8e8f0",
          boxShadow: "0 4px 20px rgba(0,0,0,.12)",
          padding: "4px 6px", zIndex: 50,
        }}>
          {/* Laser pointer toggle */}
          <button
            onClick={toggleLaser}
            title={laserMode ? "Puntero láser activo — clic para desactivar (L)" : "Puntero láser — mostrá un rayo rojo al mover el mouse (L)"}
            style={{
              background: laserMode ? "#ff3030" : "none",
              border: laserMode ? "none" : "1px solid #e0e0e0",
              borderRadius: 8, width: 34, height: 30, fontSize: 15,
              cursor: "pointer", color: laserMode ? "#fff" : "#888",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >🔴</button>

          <div style={{ width: 1, height: 20, background: "#f0f0f8", margin: "0 2px" }} />

          {/* Undo */}
          <button
            onClick={() => (meRef.current as any)?.undo?.()}
            title="Deshacer (Ctrl+Z)"
            style={{ background: "none", border: "none", borderRadius: 8, width: 32, height: 30, fontSize: 17, cursor: "pointer", color: "#666", display: "flex", alignItems: "center", justifyContent: "center" }}
          >↩</button>
          {/* Redo */}
          <button
            onClick={() => (meRef.current as any)?.redo?.()}
            title="Rehacer (Ctrl+Y)"
            style={{ background: "none", border: "none", borderRadius: 8, width: 32, height: 30, fontSize: 17, cursor: "pointer", color: "#666", display: "flex", alignItems: "center", justifyContent: "center" }}
          >↪</button>

          <div style={{ width: 1, height: 20, background: "#f0f0f8", margin: "0 2px" }} />

          {/* Zoom out */}
          <button
            onClick={() => { const me = meRef.current as any; if (me) { me.scale(Math.max(0.4, me.scaleVal - 0.2)); } }}
            title="Alejar (Ctrl + Rueda abajo)"
            style={{ background: "none", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 18, cursor: "pointer", color: "#555", display: "flex", alignItems: "center", justifyContent: "center" }}
          >−</button>

          {/* Zoom percentage */}
          <button
            onClick={() => { const me = meRef.current as any; if (me) { me.scale(1); setZoomPct(100); } }}
            title="Restablecer zoom (100%)"
            style={{ background: "none", border: "none", borderRadius: 6, padding: "0 6px", fontSize: 12, fontWeight: 700, color: "#6965db", cursor: "pointer", minWidth: 44, textAlign: "center" }}
          >{zoomPct}%</button>

          {/* Zoom in */}
          <button
            onClick={() => { const me = meRef.current as any; if (me) { me.scale(Math.min(2, me.scaleVal + 0.2)); } }}
            title="Acercar (Ctrl + Rueda arriba)"
            style={{ background: "none", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 18, cursor: "pointer", color: "#555", display: "flex", alignItems: "center", justifyContent: "center" }}
          >+</button>

          <div style={{ width: 1, height: 20, background: "#f0f0f8", margin: "0 4px" }} />

          {/* Fit to screen */}
          <button
            onClick={() => { const me = meRef.current as any; if (me) { me.scaleFit(); } }}
            title="Ajustar al tamaño de pantalla"
            style={{ background: "none", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 12, cursor: "pointer", color: "#555", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="1" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="9" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="9" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>
            Ajustar
          </button>

          {/* Center */}
          <button
            onClick={() => { meRef.current?.toCenter(); }}
            title="Centrar nodo raíz"
            style={{ background: "none", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 12, cursor: "pointer", color: "#555", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5"/><line x1="7" y1="1" x2="7" y2="3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="7" y1="10.5" x2="7" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="1" y1="7" x2="3.5" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="10.5" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Centrar
          </button>

          <div style={{ width: 1, height: 20, background: "#f0f0f8", margin: "0 2px" }} />

          {/* Keyboard shortcuts help */}
          <button
            onClick={() => setShowShortcuts(true)}
            title="Atajos de teclado (?)"
            style={{
              background: "none", border: "1px solid #e0e0e0", borderRadius: 8,
              width: 30, height: 30, fontSize: 13, cursor: "pointer",
              color: "#6965db", fontWeight: 800, display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >?</button>
        </div>
      )}

      {/* ── Custom node style panel ───────────────────────────────────────── */}
      {stylePanel && (
        <div style={{
          position: "fixed", right: 16, top: "50%", transform: "translateY(-50%)",
          background: "#fff", borderRadius: 16, boxShadow: "0 8px 32px rgba(105,101,219,.2)",
          border: "1.5px solid #e8e6ff", padding: "14px 16px", zIndex: 200,
          display: "flex", flexDirection: "column", gap: 10, minWidth: 180,
          userSelect: "none",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>✏️ Estilo del nodo</span>
            <button onClick={() => setStylePanel(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 16, lineHeight: 1, padding: "0 2px" }}>×</button>
          </div>

          {/* Font style */}
          <div>
            <div style={{ fontSize: 10, color: "#aaa", fontWeight: 700, marginBottom: 5, letterSpacing: ".05em" }}>TEXTO</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {[
                { label: "N", style: { fontWeight: "bold" }, active: nodeBold, title: "Negrita",
                  onClick: () => { const v = !nodeBold; setNodeBold(v); applyNodeStyle({ fontWeight: v ? "bold" : "normal" }); } },
                { label: "I", style: { fontStyle: "italic" }, active: nodeItalic, title: "Cursiva",
                  onClick: () => { const v = !nodeItalic; setNodeItalic(v); applyNodeStyle({ fontStyle: v ? "italic" : "normal" }); } },
                { label: "—", style: {}, active: false, title: "Restablecer texto",
                  onClick: () => { setNodeBold(false); setNodeItalic(false); setNodeColor("");
                    applyNodeStyle({ fontWeight: "normal", fontStyle: "normal", color: "" }); } },
              ].map((btn) => (
                <button key={btn.label} onClick={btn.onClick} title={btn.title}
                  style={{ ...btn.style, width: 36, height: 34, borderRadius: 8, border: `1.5px solid ${btn.active ? "#6965db" : "#e0e0e0"}`,
                    background: btn.active ? "#6965db" : "#fafafa", color: btn.active ? "#fff" : "#444",
                    cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all .12s" }}>
                  {btn.label}
                </button>
              ))}
              {/* Font size */}
              <select
                value={nodeFontSize}
                onChange={(e) => { setNodeFontSize(e.target.value); applyNodeStyle({ fontSize: e.target.value }); }}
                title="Tamaño de fuente"
                style={{ height: 34, borderRadius: 8, border: "1.5px solid #e0e0e0", background: "#fafafa",
                  color: "#444", fontSize: 12, cursor: "pointer", padding: "0 6px", outline: "none", flex: 1 }}
              >
                <option value="">Auto</option>
                {["11px","12px","13px","14px","16px","18px","20px","24px","28px","32px"].map((s) => (
                  <option key={s} value={s}>{s.replace("px","")}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Font color */}
          <div>
            <div style={{ fontSize: 10, color: "#aaa", fontWeight: 700, marginBottom: 5, letterSpacing: ".05em" }}>COLOR TEXTO</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {["#333333","#ffffff","#6965db","#2563eb","#059669","#d97706","#dc2626","#db2777","#7c3aed","#0891b2","#65a30d"].map((c) => (
                <button key={c} onClick={() => { setNodeColor(c); applyNodeStyle({ color: c }); }}
                  title={c}
                  style={{ width: 22, height: 22, borderRadius: "50%", background: c,
                    border: `2px solid ${nodeColor === c ? "#333" : c === "#ffffff" ? "#ccc" : "transparent"}`,
                    cursor: "pointer", padding: 0, outline: "none", transition: "transform .1s, border .1s",
                    transform: nodeColor === c ? "scale(1.2)" : "scale(1)" }} />
              ))}
            </div>
          </div>

          {/* Background color */}
          <div>
            <div style={{ fontSize: 10, color: "#aaa", fontWeight: 700, marginBottom: 5, letterSpacing: ".05em" }}>FONDO DEL NODO</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {["#ffffff","#f0efff","#dbeafe","#d1fae5","#fef3c7","#fee2e2","#fce7f3","#f1f5f9","#1e1e2e","#1e3a2e"].map((c) => (
                <button key={c} onClick={() => { setNodeBg(c); applyNodeStyle({ background: c }); }}
                  title={c}
                  style={{ width: 22, height: 22, borderRadius: "50%", background: c,
                    border: `2px solid ${nodeBg === c ? "#6965db" : c === "#ffffff" ? "#ddd" : "transparent"}`,
                    cursor: "pointer", padding: 0, outline: "none", transition: "transform .1s, border .1s",
                    transform: nodeBg === c ? "scale(1.2)" : "scale(1)" }} />
              ))}
            </div>
          </div>

          {/* Reset all */}
          <button onClick={() => {
            setNodeColor(""); setNodeBg(""); setNodeBold(false); setNodeItalic(false); setNodeFontSize("");
            applyNodeStyle({ color: "", background: "", fontWeight: "normal", fontStyle: "normal", fontSize: "" });
          }} style={{ background: "none", border: "1px solid #e0e0e0", borderRadius: 8, padding: "5px 10px",
            fontSize: 11, color: "#888", cursor: "pointer", fontWeight: 600, letterSpacing: ".03em" }}>
            Restablecer todo
          </button>
        </div>
      )}

      {/* Keyboard shortcuts modal */}
      {showShortcuts && <MindMapShortcuts onClose={() => setShowShortcuts(false)} />}

      {/* AI modal */}
      {showAiModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(15,10,40,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
          onClick={() => !aiLoading && setShowAiModal(false)}
        >
          <div
            style={{ background: "#fff", borderRadius: 24, width: 620, maxWidth: "95vw", boxShadow: "0 24px 80px rgba(0,0,0,0.3)", overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient header */}
            <div style={{ background: "linear-gradient(135deg,#7c4bff 0%,#6128ff 100%)", padding: "24px 28px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>✨</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, color: "#fff", fontWeight: 800 }}>Generar mapa con IA</h2>
                  <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>Texto o PDF → mapa mental en segundos</p>
                </div>
              </div>
              {/* Tabs */}
              <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                {([["text","📝 Texto"], ["pdf","📄 PDF"]] as const).map(([tab, label]) => (
                  <button key={tab} onClick={() => { if (!aiLoading) setAiTab(tab); }}
                    style={{ padding: "7px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: aiLoading ? "not-allowed" : "pointer", border: "none", transition: "all .15s",
                      background: aiTab === tab ? "#fff" : "rgba(255,255,255,0.15)",
                      color: aiTab === tab ? "#6128ff" : "rgba(255,255,255,0.85)" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: "24px 28px 28px" }}>
              {aiTab === "text" ? (
                <>
                  {/* Example chips */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                    {["Resumen de clase", "Notas de reunión", "Plan de estudio", "Temario de curso", "Artículo de blog"].map((ex) => (
                      <button key={ex} onClick={() => setAiText(ex + ": ")} disabled={aiLoading}
                        style={{ background: "#f0efff", border: "1px solid #dddaff", borderRadius: 20, padding: "4px 13px", fontSize: 12, color: "#6965db", cursor: "pointer", fontWeight: 500 }}>
                        {ex}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={aiText} onChange={(e) => setAiText(e.target.value)} disabled={aiLoading}
                    placeholder={"Pegá acá tu texto, notas o temario…\n\nEjemplo: 'El sistema solar tiene 8 planetas. Mercurio es el más cercano al sol...'"}
                    style={{ width: "100%", height: 180, padding: "14px 16px", border: "1.5px solid #e8e8e8", borderRadius: 12, fontSize: 14, color: "#333", resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.6, background: aiLoading ? "#f9f9f9" : "#fff", boxSizing: "border-box" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#6965db"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#e8e8e8"; }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: "#bbb" }}>{aiText.length} / 8000 caracteres</span>
                    {aiText.length > 8000 && <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>⚠️ Se recortará</span>}
                  </div>
                </>
              ) : (
                <>
                  <label
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files[0];
                      if (f?.type === "application/pdf") {
                        setPdfFile(f);
                        import("pdfjs-dist").then(async (pdfjsLib) => {
                          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;
                          const ab = await f.arrayBuffer();
                          const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
                          setPdfPageCount(pdf.numPages);
                        });
                      }
                    }}
                    style={{ display: "block", border: `2px dashed ${pdfFile ? "#6965db" : "#ddd"}`, borderRadius: 14, padding: "32px 20px", textAlign: "center", cursor: "pointer", background: pdfFile ? "#f5f3ff" : "#fafafa", transition: "all .2s" }}>
                    <input type="file" accept="application/pdf" style={{ display: "none" }} disabled={aiLoading}
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setPdfFile(f);
                        const pdfjsLib = await import("pdfjs-dist");
                        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;
                        const ab = await f.arrayBuffer();
                        const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
                        setPdfPageCount(pdf.numPages);
                      }} />
                    {pdfFile ? (
                      <>
                        <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
                        <div style={{ fontWeight: 700, color: "#6128ff", fontSize: 15 }}>{pdfFile.name}</div>
                        <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{pdfPageCount} páginas · {(pdfFile.size / 1024).toFixed(0)} KB</div>
                        {pdfPageCount > 40 && <div style={{ fontSize: 12, color: "#f59e0b", marginTop: 6, fontWeight: 600 }}>⚠️ Solo se procesarán las primeras 40 páginas</div>}
                        <button onClick={(e) => { e.preventDefault(); setPdfFile(null); setPdfPageCount(0); }}
                          style={{ marginTop: 12, background: "none", border: "1px solid #ddd", borderRadius: 8, padding: "4px 14px", fontSize: 12, color: "#888", cursor: "pointer" }}>
                          Cambiar archivo
                        </button>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 40, marginBottom: 10 }}>📂</div>
                        <div style={{ fontWeight: 600, color: "#444", fontSize: 15 }}>Arrastrá tu PDF aquí</div>
                        <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>o hacé click para seleccionar</div>
                        <div style={{ fontSize: 12, color: "#bbb", marginTop: 8 }}>Máx. 40 páginas procesadas · PDF en español o inglés</div>
                      </>
                    )}
                  </label>
                </>
              )}

              {/* Loading progress */}
              {aiLoading && (
                <div style={{ marginTop: 16, background: "#f5f3ff", borderRadius: 12, padding: "14px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #c4b5fd", borderTopColor: "#6128ff", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#6128ff" }}>
                        {aiLoadingStep === "extracting" ? "Extrayendo texto del PDF…" : "Generando mapa mental…"}
                      </div>
                      <div style={{ fontSize: 12, color: "#a78bfa", marginTop: 2 }}>
                        {aiLoadingStep === "extracting" ? "Leyendo páginas del documento" : "Claude AI está analizando el contenido"}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, height: 4, background: "#e9d5ff", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "linear-gradient(90deg,#7c4bff,#6128ff)", borderRadius: 4, width: aiLoadingStep === "extracting" ? "40%" : "85%", transition: "width 1s ease" }} />
                  </div>
                </div>
              )}

              {/* Error */}
              {aiError && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginTop: 14, fontSize: 13, color: "#dc2626" }}>
                  ⚠️ {aiError}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
                <button onClick={() => { setShowAiModal(false); setPdfFile(null); setPdfPageCount(0); }} disabled={aiLoading}
                  style={{ background: "none", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 20px", fontSize: 14, color: "#555", cursor: "pointer" }}>
                  Cancelar
                </button>
                <button onClick={generateFromAI}
                  disabled={aiLoading || (aiTab === "text" ? !aiText.trim() : !pdfFile)}
                  style={{
                    background: (aiLoading || (aiTab === "text" ? !aiText.trim() : !pdfFile)) ? "#c4b5fd" : "linear-gradient(135deg,#7c4bff,#6128ff)",
                    border: "none", borderRadius: 10, padding: "10px 28px", fontSize: 14,
                    color: "#fff", cursor: (aiLoading || (aiTab === "text" ? !aiText.trim() : !pdfFile)) ? "not-allowed" : "pointer",
                    fontWeight: 700, boxShadow: "0 4px 16px rgba(97,40,255,.3)",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                  {aiLoading ? "Procesando…" : "✨ Generar mapa mental"}
                </button>
              </div>

              <p style={{ margin: "12px 0 0", fontSize: 11, color: "#ccc", textAlign: "center" }}>
                Usa Claude AI · El mapa reemplazará el contenido actual
              </p>
            </div>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Templates modal */}
      {showTemplates && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowTemplates(false)}
        >
          <div
            style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", width: 620, maxWidth: "95vw", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: "0 0 6px", fontSize: 18, color: "#222" }}>Elegí una plantilla</h2>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#888" }}>O cerrá para empezar desde cero</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {MIND_TEMPLATES.map((t) => (
                <div
                  key={t.name}
                  onClick={() => applyTemplate(t.data)}
                  style={{
                    border: "2px solid #e0e0e0", borderRadius: 12, padding: "18px 14px",
                    cursor: "pointer", textAlign: "center",
                    transition: "border-color 0.12s, background 0.12s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#6965db"; (e.currentTarget as HTMLElement).style.background = "#f5f4ff"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e0e0e0"; (e.currentTarget as HTMLElement).style.background = "#fff"; }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{t.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 4 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "#888", lineHeight: 1.4 }}>{t.desc}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowTemplates(false)} style={{ marginTop: 18, float: "right", background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 13 }}>
              Empezar desde cero
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
