import { useEffect } from "react";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

const EDU_LIBRARY_LOADED_KEY = "edu_library_loaded_v5";

export const useEduLibrary = (
  excalidrawAPI: ExcalidrawImperativeAPI | null,
) => {
  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }
    if (localStorage.getItem(EDU_LIBRARY_LOADED_KEY)) {
      return;
    }

    fetch("/edu-library.excalidrawlib")
      .then((res) => res.json())
      .then((lib) => {
        const items = lib.libraryItems || [];
        excalidrawAPI.updateLibrary({
          libraryItems: items,
          merge: true,
          openLibraryMenu: true,
        });
        excalidrawAPI.updateScene({
          appState: { openSidebar: { name: "default", tab: "library" } },
        });
        localStorage.setItem(EDU_LIBRARY_LOADED_KEY, "1");
      })
      .catch(console.error);
  }, [excalidrawAPI]);
};
