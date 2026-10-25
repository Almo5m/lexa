/**
 * Where the floating Bo sits on screen. Pure math, so it is tested without a browser.
 * A free position is stored as two fractions (0 to 1) of the room he can move in,
 * so it stays sensible after a rotation or a resize.
 */
export interface Point {
  x: number;
  y: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface Fractions {
  fx: number;
  fy: number;
}

export const EDGE = 8;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

/** Keeps Bo fully on screen. `top` and `bottom` reserve room for bars, like the tab bar on a phone. */
export function clampPosition(point: Point, viewport: Viewport, size: number, reserve = { top: 0, bottom: 0 }): Point {
  return {
    x: clamp(point.x, EDGE, viewport.width - size - EDGE),
    y: clamp(point.y, EDGE + reserve.top, viewport.height - size - EDGE - reserve.bottom),
  };
}

export function toFractions(point: Point, viewport: Viewport, size: number): Fractions {
  const roomX = viewport.width - size - 2 * EDGE;
  const roomY = viewport.height - size - 2 * EDGE;
  return {
    fx: roomX <= 0 ? 0 : clamp((point.x - EDGE) / roomX, 0, 1),
    fy: roomY <= 0 ? 0 : clamp((point.y - EDGE) / roomY, 0, 1),
  };
}

export function fromFractions(fractions: Fractions, viewport: Viewport, size: number): Point {
  const roomX = Math.max(viewport.width - size - 2 * EDGE, 0);
  const roomY = Math.max(viewport.height - size - 2 * EDGE, 0);
  return { x: EDGE + fractions.fx * roomX, y: EDGE + fractions.fy * roomY };
}

/** Bo's home: the bottom corner on the reading-end side, above the tab bar on a phone. */
export function dockPosition(viewport: Viewport, size: number, rtl: boolean, bottomBar: number): Point {
  return clampPosition(
    { x: rtl ? EDGE + 4 : viewport.width - size - EDGE - 4, y: viewport.height - size - bottomBar - 12 },
    viewport,
    size,
  );
}

/** A spot right next to an element: above it when there is room, below it otherwise. Used when Bo guides. */
export function nextToTarget(rect: { left: number; top: number; width: number; height: number }, viewport: Viewport, size: number): Point {
  const centered = rect.left + rect.width / 2 - size / 2;
  const above = rect.top - size - 6;
  const y = above >= EDGE ? above : rect.top + rect.height + 6;
  return clampPosition({ x: centered, y }, viewport, size);
}

/** Which way the menu and the speech bubble open, so they never leave the screen. */
export function popoverSide(point: Point, viewport: Viewport, size: number): { below: boolean; alignEnd: boolean } {
  return {
    below: point.y < 230,
    alignEnd: point.x + size / 2 > viewport.width / 2,
  };
}
