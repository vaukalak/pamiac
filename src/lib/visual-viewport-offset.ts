const VIEWPORT_OFFSET = [
  "--bn-vv-top",
  "--bn-vv-left",
  "--bn-vv-width",
  "--bn-vv-height",
  "--bn-vv-scale",
] as const;

interface ViewportBox {
  height: number;
  offsetLeft: number;
  offsetTop: number;
  scale: number;
  width: number;
}

export function visualViewportBox(
  viewport: Pick<VisualViewport, "height" | "offsetLeft" | "offsetTop" | "scale" | "width"> | null,
  fallback: { height: number; width: number },
): ViewportBox {
  return {
    height: viewport?.height ?? fallback.height,
    offsetLeft: viewport?.offsetLeft ?? 0,
    offsetTop: viewport?.offsetTop ?? 0,
    scale: viewport?.scale ?? 1,
    width: viewport?.width ?? fallback.width,
  };
}

export function writeVisualViewportOffset(root: HTMLElement, box: ViewportBox) {
  root.style.setProperty("--bn-vv-top", `${box.offsetTop}px`);
  root.style.setProperty("--bn-vv-left", `${box.offsetLeft}px`);
  root.style.setProperty("--bn-vv-width", `${box.width}px`);
  root.style.setProperty("--bn-vv-height", `${box.height}px`);
  root.style.setProperty("--bn-vv-scale", `${box.scale}`);
}

export function clearVisualViewportOffset(root: HTMLElement) {
  for (const name of VIEWPORT_OFFSET) root.style.removeProperty(name);
}

export function bindVisualViewportOffset(root: HTMLElement, view: Window) {
  function sync() {
    writeVisualViewportOffset(
      root,
      visualViewportBox(view.visualViewport, {
        height: view.innerHeight,
        width: view.innerWidth,
      }),
    );
  }

  sync();
  view.visualViewport?.addEventListener("resize", sync);
  view.visualViewport?.addEventListener("scroll", sync);
  view.addEventListener("resize", sync);
  return () => {
    view.visualViewport?.removeEventListener("resize", sync);
    view.visualViewport?.removeEventListener("scroll", sync);
    view.removeEventListener("resize", sync);
    clearVisualViewportOffset(root);
  };
}
