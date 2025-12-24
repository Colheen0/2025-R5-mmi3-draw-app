import { getCanvasDimensions } from "./getCanvasDimensions";

  export const relativeToAbsoluteCoordinates = (
    parentElement: HTMLDivElement,
    relativeX: number, 
    relativeY: number
  ): { x: number, y: number } => {
    if (!parentElement) return { x: 0, y: 0 };
    
    const { width, height } = getCanvasDimensions(parentElement)
    
    return {
      x: relativeX * width,   // Conversion en pixels
      y: relativeY * height   // Conversion en pixels
    };
  };