import { getCanvasDimensions } from "./getCanvasDimensions";

export const absoluteToRelativeCoordinates = ((
    parentElement: HTMLDivElement,
    absoluteX: number, 
    absoluteY: number
  ): { x: number, y: number } => {
    if (!parentElement) return { x: 0, y: 0 };
    const { width, height } = getCanvasDimensions(parentElement);
    return {
      x: absoluteX / width,   // Ratio de 0 à 1
      y: absoluteY / height   // Ratio de 0 à 1
    };
  });