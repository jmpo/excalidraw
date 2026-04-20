import "@excalidraw/excalidraw/global";
import "@excalidraw/excalidraw/css";

declare module "@mind-elixir/node-menu-neo" {
  const nodeMenuNeo: any;
  export default nodeMenuNeo;
}

interface Window {
  __EXCALIDRAW_SHA__: string | undefined;
}
