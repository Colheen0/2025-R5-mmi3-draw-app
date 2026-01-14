export const getCanvasDimensions = (parentElement: HTMLDivElement) => {
  // Obtenir les dimensions CSS du canvas (pas la résolution interne)
    const canvasWidth = parseFloat(parentElement.style.getPropertyValue('--canvas-width') || '800'
    );
    const canvasHeight = parseFloat(
      parentElement.style.getPropertyValue('--canvas-height') || '450'
    );
    

  return {
    width: canvasWidth,
    height: canvasHeight
  }
}