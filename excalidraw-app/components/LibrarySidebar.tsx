import { useEffect, useState, useCallback } from "react";
import { exportToSvg } from "@excalidraw/excalidraw";

import type {
  ExcalidrawImperativeAPI,
  LibraryItem,
  LibraryItems,
} from "@excalidraw/excalidraw/types";

// ─── Category mapping ─────────────────────────────────────────────────────────

const CATEGORIES: {
  label: string;
  icon: string;
  match: (name: string) => boolean;
}[] = [
  {
    label: "Figuras humanas",
    icon: "🧑",
    match: (n) =>
      [
        "stick man",
        "moustache",
        "girl",
        "guy",
        "grandma",
        "child",
        "shrug",
        "happy",
        "sad",
      ].some((k) => n.toLowerCase().includes(k)),
  },
  {
    label: "Matemáticas",
    icon: "📐",
    match: (n) =>
      [
        "coordinate",
        "venn",
        "number line",
        "sphere",
        "prism",
        "parallel",
        "graph paper",
      ].some((k) => n.toLowerCase().includes(k)),
  },
  {
    label: "Diapositivas",
    icon: "🖥️",
    match: (n) =>
      n.toLowerCase().startsWith("diap.") ||
      n.toLowerCase().startsWith("slide"),
  },
  {
    label: "Negocios",
    icon: "💼",
    match: (n) =>
      ["canvas", "proposition", "business model"].some((k) =>
        n.toLowerCase().includes(k),
      ),
  },
  {
    label: "Líneas",
    icon: "📏",
    match: (n) => n.toLowerCase().startsWith("línea"),
  },
];

const getCategory = (name: string): string => {
  for (const cat of CATEGORIES) {
    if (cat.match(name)) return cat.label;
  }
  return "General";
};

// ─── SVG cache & insert ───────────────────────────────────────────────────────

const svgCache = new Map<string, string>();

const insertLibraryItem = (
  item: LibraryItem,
  excalidrawAPI: ExcalidrawImperativeAPI,
) => {
  const appState = excalidrawAPI.getAppState();
  const existingElements = excalidrawAPI.getSceneElements();

  const viewCenterX =
    appState.width / 2 / appState.zoom.value - appState.scrollX;
  const viewCenterY =
    appState.height / 2 / appState.zoom.value - appState.scrollY;

  const xs = item.elements.flatMap((el) => [
    el.x,
    el.x + ((el as any).width ?? 0),
  ]);
  const ys = item.elements.flatMap((el) => [
    el.y,
    el.y + ((el as any).height ?? 0),
  ]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const dx = viewCenterX - (minX + maxX) / 2;
  const dy = viewCenterY - (minY + maxY) / 2;

  const idMap = new Map<string, string>();
  item.elements.forEach((el) => idMap.set(el.id, crypto.randomUUID()));

  const newElements = item.elements.map((el) => ({
    ...el,
    id: idMap.get(el.id)!,
    x: el.x + dx,
    y: el.y + dy,
    boundElements:
      el.boundElements?.map((be) => ({
        ...be,
        id: idMap.get(be.id) ?? be.id,
      })) ?? null,
    ...((el as any).containerId != null
      ? {
          containerId:
            idMap.get((el as any).containerId) ?? (el as any).containerId,
        }
      : {}),
    ...((el as any).startBinding
      ? {
          startBinding: {
            ...(el as any).startBinding,
            elementId:
              idMap.get((el as any).startBinding.elementId) ??
              (el as any).startBinding.elementId,
          },
        }
      : {}),
    ...((el as any).endBinding
      ? {
          endBinding: {
            ...(el as any).endBinding,
            elementId:
              idMap.get((el as any).endBinding.elementId) ??
              (el as any).endBinding.elementId,
          },
        }
      : {}),
  }));

  excalidrawAPI.updateScene({
    elements: [...existingElements, ...newElements] as any,
  });
};

// ─── Card ─────────────────────────────────────────────────────────────────────

const LibraryItemCard = ({
  item,
  onInsert,
}: {
  item: LibraryItem;
  onInsert: (item: LibraryItem) => void;
}) => {
  const [svgUrl, setSvgUrl] = useState<string>(svgCache.get(item.id) ?? "");
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (svgCache.has(item.id)) return;
    exportToSvg({
      elements: item.elements,
      appState: {
        exportBackground: true,
        viewBackgroundColor: "#ffffff",
        exportWithDarkMode: false,
      },
      files: {},
    }).then((svg) => {
      const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        new XMLSerializer().serializeToString(svg),
      )}`;
      svgCache.set(item.id, url);
      setSvgUrl(url);
    });
  }, [item.id]);

  return (
    <div
      onClick={() => onInsert(item)}
      title={`Insertar: ${item.name ?? "elemento"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: "pointer",
        padding: "6px",
        borderRadius: 6,
        border: `1.5px solid ${hovered ? "#6965db" : "#e8e8e8"}`,
        background: hovered ? "#f0f0ff" : "#fafafa",
        transition: "border-color 0.12s, background 0.12s",
        userSelect: "none",
      }}
    >
      <div
        style={{
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background: "#fff",
          borderRadius: 4,
          marginBottom: 4,
          border: "1px solid #efefef",
        }}
      >
        {svgUrl ? (
          <img
            src={svgUrl}
            alt={item.name}
            style={{ maxWidth: "100%", maxHeight: 56, objectFit: "contain" }}
          />
        ) : (
          <div style={{ color: "#ccc", fontSize: 18 }}>⋯</div>
        )}
      </div>
      <div
        style={{
          fontSize: 10,
          color: "#555",
          textAlign: "center",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {item.name ?? "Sin nombre"}
      </div>
    </div>
  );
};

// ─── Category section ─────────────────────────────────────────────────────────

const CategorySection = ({
  label,
  icon,
  items,
  onInsert,
  defaultOpen,
}: {
  label: string;
  icon: string;
  items: LibraryItem[];
  onInsert: (item: LibraryItem) => void;
  defaultOpen: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ marginBottom: 2 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 8px",
          background: open ? "#f0f0ff" : "#f5f5f5",
          border: "none",
          borderRadius: 5,
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 700,
          color: "#444",
          textAlign: "left",
        }}
      >
        <span>{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
        <span style={{ fontSize: 10, color: "#999" }}>{items.length}</span>
        <span style={{ fontSize: 10, color: "#aaa", marginLeft: 2 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 5,
            padding: "5px 0 4px",
          }}
        >
          {items.map((item) => (
            <LibraryItemCard key={item.id} item={item} onInsert={onInsert} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export const LibrarySidebar = ({
  libraryItems,
  excalidrawAPI,
  onClose,
}: {
  libraryItems: LibraryItems;
  excalidrawAPI: ExcalidrawImperativeAPI;
  onClose: () => void;
}) => {
  const [search, setSearch] = useState("");

  const handleInsert = useCallback(
    (item: LibraryItem) => insertLibraryItem(item, excalidrawAPI),
    [excalidrawAPI],
  );

  const filtered = search.trim()
    ? libraryItems.filter((item) =>
        (item.name ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : null;

  // Group by category
  const grouped: { label: string; icon: string; items: LibraryItem[] }[] = [];
  if (!filtered) {
    const map = new Map<string, LibraryItem[]>();
    const order: string[] = [];
    for (const item of libraryItems) {
      const cat = getCategory(item.name ?? "");
      if (!map.has(cat)) {
        map.set(cat, []);
        order.push(cat);
      }
      map.get(cat)!.push(item);
    }
    for (const label of order) {
      const catDef = CATEGORIES.find((c) => c.label === label);
      grouped.push({
        label,
        icon: catDef?.icon ?? "📦",
        items: map.get(label)!,
      });
    }
  }

  return (
    <div
      style={{
        width: 210,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-surface-low, #fff)",
        borderLeft: "1px solid var(--color-border, #e0e0e0)",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 10px 8px",
          borderBottom: "1px solid #eee",
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13, color: "#333" }}>
          📚 Biblioteca
        </span>
        <button
          onClick={onClose}
          title="Cerrar"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#999",
            fontSize: 18,
            lineHeight: 1,
            padding: "0 2px",
          }}
        >
          ×
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: "6px 8px", flexShrink: 0 }}>
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "5px 8px",
            border: "1px solid #ddd",
            borderRadius: 5,
            fontSize: 12,
            outline: "none",
            boxSizing: "border-box",
            color: "#333",
          }}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px 8px" }}>
        {filtered ? (
          // Search results flat grid
          filtered.length === 0 ? (
            <div
              style={{
                color: "#aaa",
                fontSize: 12,
                textAlign: "center",
                paddingTop: 24,
              }}
            >
              Sin resultados
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 6,
                alignContent: "start",
              }}
            >
              {filtered.map((item) => (
                <LibraryItemCard
                  key={item.id}
                  item={item}
                  onInsert={handleInsert}
                />
              ))}
            </div>
          )
        ) : libraryItems.length === 0 ? (
          <div
            style={{
              color: "#aaa",
              fontSize: 12,
              textAlign: "center",
              paddingTop: 24,
            }}
          >
            Cargando...
          </div>
        ) : (
          // Grouped by category
          grouped.map((group, i) => (
            <CategorySection
              key={group.label}
              label={group.label}
              icon={group.icon}
              items={group.items}
              onInsert={handleInsert}
              defaultOpen={i === 0}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "5px 8px",
          fontSize: 10,
          color: "#bbb",
          borderTop: "1px solid #eee",
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        Clic para insertar en el centro
      </div>
    </div>
  );
};
