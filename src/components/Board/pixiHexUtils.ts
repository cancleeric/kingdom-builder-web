/**
 * Pixi v8 drawing utilities for hex grid rendering.
 * Wraps core/hex.ts functions — no logic duplication.
 */
import { Graphics } from 'pixi.js';
import { axialToPixel, hexCorners, HEX_SIZE } from '../../core/hex';
import type { AxialCoord } from '../../core/hex';

/**
 * CSS hex color string (#rrggbb or #rgb) to Pixi number (0xRRGGBB).
 */
export function cssColorToPixi(css: string): number {
  const hex = css.replace('#', '');
  if (hex.length === 3) {
    // Expand short form
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return (r << 16) | (g << 8) | b;
  }
  return parseInt(hex.length === 6 ? hex : hex.slice(0, 6), 16);
}

/**
 * Draw a filled hex polygon on a Graphics object using Pixi v8 API.
 * Uses moveTo/lineTo to avoid poly() TypeScript overload ambiguity.
 *
 * @param g           Graphics object (will be cleared first)
 * @param coord       Axial coordinate
 * @param fillColor   Fill color (0xRRGGBB)
 * @param fillAlpha   Fill alpha (0–1)
 * @param strokeColor Stroke color (0xRRGGBB), undefined = no stroke
 * @param strokeWidth Stroke pixel width
 */
export function drawHex(
  g: Graphics,
  coord: AxialCoord,
  fillColor: number,
  fillAlpha: number,
  strokeColor?: number,
  strokeWidth?: number,
): void {
  const corners = hexCorners(coord, HEX_SIZE);
  g.clear();

  if (strokeColor !== undefined && strokeWidth && strokeWidth > 0) {
    g.setStrokeStyle({ width: strokeWidth, color: strokeColor, alpha: 1 });
  }

  g.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < 6; i++) {
    g.lineTo(corners[i].x, corners[i].y);
  }
  g.closePath();
  g.fill({ color: fillColor, alpha: fillAlpha });

  if (strokeColor !== undefined && strokeWidth && strokeWidth > 0) {
    g.stroke();
  }
}

/**
 * Draw only the hex border (no fill) — used for hover/selected overlays.
 */
export function drawHexBorder(
  g: Graphics,
  coord: AxialCoord,
  strokeColor: number,
  strokeWidth: number,
  strokeAlpha = 1,
): void {
  const corners = hexCorners(coord, HEX_SIZE);
  g.clear();
  g.setStrokeStyle({ width: strokeWidth, color: strokeColor, alpha: strokeAlpha });
  g.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < 6; i++) {
    g.lineTo(corners[i].x, corners[i].y);
  }
  g.closePath();
  g.stroke();
}

/**
 * Draw a filled circle (settlement marker) centred on the hex.
 */
export function drawSettlementCircle(
  g: Graphics,
  coord: AxialCoord,
  color: number,
  radius = HEX_SIZE * 0.35,
): void {
  const center = axialToPixel(coord, HEX_SIZE);
  g.clear();
  g.circle(center.x, center.y, radius);
  g.fill({ color, alpha: 1 });
  // White ring outline for contrast
  g.circle(center.x, center.y, radius);
  g.setStrokeStyle({ width: 2, color: 0xffffff, alpha: 0.8 });
  g.stroke();
}

/**
 * Draw a small text-like castle indicator (⬡ shape with fill + "C" not needed in Phase 1).
 * Uses a filled diamond / rectangle above centre for simplicity.
 */
export function drawCastleMarker(g: Graphics, coord: AxialCoord): void {
  const center = axialToPixel(coord, HEX_SIZE);
  const s = HEX_SIZE * 0.22;
  g.clear();
  // Simple rotated square
  g.moveTo(center.x, center.y - s * 1.4);
  g.lineTo(center.x + s, center.y - s * 0.4);
  g.lineTo(center.x, center.y + s * 0.6);
  g.lineTo(center.x - s, center.y - s * 0.4);
  g.closePath();
  g.fill({ color: 0xffd700, alpha: 0.9 });
  g.setStrokeStyle({ width: 1.5, color: 0xaa8800, alpha: 1 });
  g.stroke();
}

/**
 * Draw a small location indicator dot (non-castle special locations).
 */
export function drawLocationDot(g: Graphics, coord: AxialCoord, color: number): void {
  const center = axialToPixel(coord, HEX_SIZE);
  g.clear();
  g.circle(center.x, center.y - HEX_SIZE * 0.25, HEX_SIZE * 0.18);
  g.fill({ color, alpha: 0.85 });
}
