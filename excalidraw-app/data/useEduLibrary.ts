import { useEffect } from "react";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

// Bump this key whenever EXTRA_LIBRARIES changes so existing users reload them.
const EDU_LIBRARY_LOADED_KEY = "edu_library_loaded_v13";

const EXTRA_LIBRARIES = [
  // UI / general (existing)
  "https://libraries.excalidraw.com/libraries/g-script/forms.excalidrawlib",
  "https://libraries.excalidraw.com/libraries/ferminrp/awesome-icons.excalidrawlib",
  "https://libraries.excalidraw.com/libraries/excacomp/web-kit.excalidrawlib",
  "https://libraries.excalidraw.com/libraries/anumithaapollo12/emojis.excalidrawlib",
  "https://libraries.excalidraw.com/libraries/h7y/dropdowns.excalidrawlib",
  "https://libraries.excalidraw.com/libraries/dwelle/despair.excalidrawlib",
  // ── Education packs for teachers ──────────────────────────────────────────
  // Math & geometry
  "https://libraries.excalidraw.com/libraries/https-github-com-ytrkptl/math-teacher-library.excalidrawlib",
  "https://libraries.excalidraw.com/libraries/jjadup/mathematical-symbols.excalidrawlib",
  "https://libraries.excalidraw.com/libraries/lipis/polygons.excalidrawlib",
  // Science
  "https://libraries.excalidraw.com/libraries/sharathsanketh/biology.excalidrawlib",
  "https://libraries.excalidraw.com/libraries/gabi-as-cosmos/periodic-table.excalidrawlib",
  // Music
  "https://libraries.excalidraw.com/libraries/l8y/music-instruments.excalidrawlib",
  // Physics / electronics / CS
  "https://libraries.excalidraw.com/libraries/rkjc/schematic-symbols.excalidrawlib",
  "https://libraries.excalidraw.com/libraries/thebrahmnicboy/Logic-Gates.excalidrawlib",
  // Classroom annotations
  "https://libraries.excalidraw.com/libraries/ferminrp/post-it.excalidrawlib",
  "https://libraries.excalidraw.com/libraries/ocapraro/bubbles.excalidrawlib",
  // Storytelling & collaboration scenes (people / soft skills)
  "https://libraries.excalidraw.com/libraries/drwnio/storytelling.excalidrawlib",
  "https://libraries.excalidraw.com/libraries/gianpaima/stick-figures-collaboration.excalidrawlib",
];

export const useEduLibrary = (
  excalidrawAPI: ExcalidrawImperativeAPI | null,
) => {
  useEffect(() => {
    if (!excalidrawAPI) return;
    if (localStorage.getItem(EDU_LIBRARY_LOADED_KEY)) return;

    const urls = ["/edu-library.excalidrawlib", ...EXTRA_LIBRARIES];

    Promise.allSettled(urls.map((url) =>
      fetch(url)
        .then((r) => { if (!r.ok) throw new Error(`${r.status} ${url}`); return r.json(); })
        .then((lib) => {
          // Handle v1 format: { library: [[...elements...], ...] }
          // Handle v2 format: { libraryItems: [{ id, name, elements }, ...] }
          let items: any[] = [];
          if (Array.isArray(lib.libraryItems) && lib.libraryItems.length > 0) {
            items = lib.libraryItems;
          } else if (Array.isArray(lib.library) && lib.library.length > 0) {
            items = lib.library.map((elements: any[], i: number) => ({
              id: `${url}-${i}`,
              name: "",
              elements: Array.isArray(elements) ? elements : [],
              status: "unpublished" as const,
            }));
          }
          console.log(`[EduLib] loaded ${url}: ${items.length} items (fmt=${lib.libraryItems ? "v2" : "v1"})`);
          return { libraryItems: items };
        })
        .catch((e) => { console.warn(`[EduLib] failed ${url}:`, e); return { libraryItems: [] }; })
    )).then((results) => {
        const allItems: any[] = [];
        for (const result of results) {
          if (result.status === "fulfilled") {
            allItems.push(...(result.value.libraryItems ?? []));
          }
        }
        console.log(`[EduLib] total items before dedup: ${allItems.length}`);
        if (allItems.length === 0) return;
        // Deduplicate by id only — keep items even if unnamed (they may still be valid)
        const seen = new Set<string>();
        const unique = allItems.filter((item) => {
          if (!item.id || seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
        console.log(`[EduLib] unique items after dedup: ${unique.length}`);
        excalidrawAPI.updateLibrary({ libraryItems: unique, merge: false });
        localStorage.setItem(EDU_LIBRARY_LOADED_KEY, "1");
      });
  }, [excalidrawAPI]);
};
