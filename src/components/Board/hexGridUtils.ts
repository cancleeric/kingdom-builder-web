import { AxialCoord, HEX_SIZE, axialToPixel } from '../../core/hex';
import { HexCell as HexCellData } from '../../types';
import { Transform } from '../../hooks/useBoardTransform';

/**
 * Given a client-space coordinate (e.g. from mouse or touch event),
 * reverse the container transform and SVG viewBox scaling to find
 * which hex cell is at that point. Returns null if no cell is close enough.
 */
export function findHexAtClientXY(
  clientX: number,
  clientY: number,
  cells: HexCellData[],
  transform: Transform,
  containerRect: DOMRect,
  svgElement: SVGSVGElement,
  gridOffset: number,
): AxialCoord | null {
  // Step 1: position relative to container
  const cx = clientX - containerRect.left;
  const cy = clientY - containerRect.top;

  // Step 2: undo transform (scale + translate)
  const sx = (cx - transform.translateX) / transform.scale;
  const sy = (cy - transform.translateY) / transform.scale;

  // Step 3: SVG viewBox scaling
  // The inner <div> is 100%×100% of container, SVG is also 100%×100% of that div
  // We need the ratio between the rendered SVG size and its viewBox
  const svgRect = svgElement.getBoundingClientRect();
  const viewBox = svgElement.viewBox.baseVal;
  const scaleX = svgRect.width > 0 ? viewBox.width / svgRect.width : 1;
  const scaleY = svgRect.height > 0 ? viewBox.height / svgRect.height : 1;

  // sx/sy are in the coordinate space of the inner div (which is 100%x100% of container)
  // svgRect is also in client space, so we need to account for svgRect offset relative to container
  const svgOffsetX = svgRect.left - containerRect.left;
  const svgOffsetY = svgRect.top - containerRect.top;

  const viewBoxX = (sx - svgOffsetX) * scaleX;
  const viewBoxY = (sy - svgOffsetY) * scaleY;

  // Step 4: subtract gridOffset to get hex coordinate space
  const hexSpaceX = viewBoxX - gridOffset;
  const hexSpaceY = viewBoxY - gridOffset;

  // Step 5: find closest cell within HEX_SIZE * 0.95 threshold
  let bestCell: HexCellData | null = null;
  let bestDist = HEX_SIZE * 0.95;

  for (const cell of cells) {
    const center = axialToPixel(cell.coord, HEX_SIZE);
    const dx = hexSpaceX - center.x;
    const dy = hexSpaceY - center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < bestDist) {
      bestDist = dist;
      bestCell = cell;
    }
  }

  return bestCell ? bestCell.coord : null;
}
