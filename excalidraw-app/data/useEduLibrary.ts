import { useEffect } from "react";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

const EDU_LIBRARY_LOADED_KEY = "edu_library_loaded_v11";

const EXTRA_LIBRARIES = [
  "https://libraries.excalidraw.com/libraries/g-script/forms.excalidrawlib",
  "https://libraries.excalidraw.com/libraries/ferminrp/awesome-icons.excalidrawlib",
  "https://libraries.excalidraw.com/libraries/excacomp/web-kit.excalidrawlib",
  "https://libraries.excalidraw.com/libraries/anumithaapollo12/emojis.excalidrawlib",
  "https://libraries.excalidraw.com/libraries/h7y/dropdowns.excalidrawlib",
  "https://libraries.excalidraw.com/libraries/dwelle/despair.excalidrawlib",
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
