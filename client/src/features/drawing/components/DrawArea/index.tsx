import { useCallback, useEffect, useMemo, useRef } from "react";
import { getCoordinatesRelativeToElement } from "../../utils/getCanvasCoordinates";
import { useMyUserStore } from "../../../user/store/useMyUserStore";
import styles from './DrawArea.module.css';
import { SocketManager } from "../../../../shared/services/SocketManager";
import type { DrawStroke, Point } from "../../../../shared/types/drawing.type";

interface DrawAreaProps {
  strokeColor: string; 
  strokeWidth: number; 
}

export function DrawArea({ strokeColor, strokeWidth }: DrawAreaProps) {
  // ===================
  // REFS
  // ===================
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const otherUserStrokes = useRef<Map<string, Point[]>>(new Map());
  const otherUserTools = useRef<Map<string, { strokeColor: string, strokeWidth: number }>>(new Map());
  const canvasDimensions = useRef({ width: 0, height: 0 });

  const { myUser } = useMyUserStore();
  const canUserDraw = useMemo(() => myUser !== null, [myUser]); 

  // ===================
  // LOGIQUE DE DESSIN & NETTOYAGE
  // ===================

  // AJOUT : Fonction pour vider le canvas
  const clearCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // On efface visuellement
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // On vide la mémoire locale des tracés des autres
    otherUserStrokes.current.clear();
    otherUserTools.current.clear();
  }, []);

  const getCanvasCoordinates = useCallback((e: { clientX: number, clientY: number }) => {
    return getCoordinatesRelativeToElement(e.clientX, e.clientY, canvasRef.current);
  }, []);

  const drawLine = useCallback((
    from: { x: number, y: number } | null,
    to: { x: number, y: number },
    options?: { strokeColor?: string, strokeWidth?: number }
  ) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    ctx.strokeStyle = options?.strokeColor || '#000'; 
    ctx.lineWidth = options?.strokeWidth || 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (from) {
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
    }
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }, []);

  // ===================
  // EVENTS SOURIS
  // ===================

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return;

    const coordinates = getCanvasCoordinates(e);

    const currentColor = strokeColor;
    const currentWidth = strokeWidth;

    drawLine(null, { x: coordinates.x, y: coordinates.y }, { strokeColor: currentColor, strokeWidth: currentWidth });

    const width = canvasDimensions.current.width;
    const height = canvasDimensions.current.height;

    if (width > 0 && height > 0) {
      SocketManager.emit('draw:move', {
        x: coordinates.x / width,
        y: coordinates.y / height
      });
    }
  }, [drawLine, getCanvasCoordinates, strokeColor, strokeWidth]);

  const onMouseUp = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return;
    SocketManager.emit('draw:end');
    canvasRef.current.removeEventListener('mousemove', onMouseMove);
    canvasRef.current.removeEventListener('mouseup', onMouseUp);
    console.log(e);
  }, [onMouseMove]);
  
  const onMouseDown: React.MouseEventHandler<HTMLCanvasElement> = useCallback((e) => {
    if (!canUserDraw) return;
    const canvas = e.currentTarget;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coordinates = getCanvasCoordinates(e);
    
    const currentColor = strokeColor;
    const currentWidth = strokeWidth;

    drawLine(coordinates, coordinates, { strokeColor: currentColor, strokeWidth: currentWidth });

    const width = canvasDimensions.current.width;
    const height = canvasDimensions.current.height;

    if (width > 0 && height > 0) {
      SocketManager.emit('draw:start', {
        x: coordinates.x / width,
        y: coordinates.y / height,
        strokeWidth: currentWidth,
        color: currentColor 
      });
    }

    canvasRef.current?.addEventListener('mousemove', onMouseMove);
    canvasRef.current?.addEventListener('mouseup', onMouseUp);
  }, [canUserDraw, onMouseMove, onMouseUp, drawLine, getCanvasCoordinates, strokeColor, strokeWidth]);

  // ===================
  // GESTION DES AUTRES USERS 
  // ===================

  const drawOtherUserPoints = useCallback((socketId: string, points: Point[], options?: { strokeColor?: string, strokeWidth?: number }) => {
    if (canvasDimensions.current.width === 0) return;

    const previousPoints = otherUserStrokes.current.get(socketId) || [];
    const currentWidth = canvasDimensions.current.width;
    const currentHeight = canvasDimensions.current.height;

    let drawOptions = options;
    if (!drawOptions) {
        drawOptions = otherUserTools.current.get(socketId) || { strokeColor: '#000', strokeWidth: 3 };
    }

    points.forEach((point, index) => {
      if (previousPoints[index]) return;
      const to = { x: point.x * currentWidth, y: point.y * currentHeight };
      let from;
      if (index === 0) from = to;
      else {
         const prevRaw = points[index - 1];
         from = { x: prevRaw.x * currentWidth, y: prevRaw.y * currentHeight };
      }
      drawLine(from, to, drawOptions);
    });
  }, [drawLine]);

  const onOtherUserDrawStart = useCallback((payload: DrawStroke) => {
    const userOptions = {
        strokeColor: payload.color || '#000',
        strokeWidth: payload.strokeWidth || 3
    };
    otherUserTools.current.set(payload.socketId, userOptions);
    drawOtherUserPoints(payload.socketId, payload.points, userOptions);
    otherUserStrokes.current.set(payload.socketId, payload.points);
  }, [drawOtherUserPoints]);

  const onOtherUserDrawMove = useCallback((payload: DrawStroke) => {
    drawOtherUserPoints(payload.socketId, payload.points);
    otherUserStrokes.current.set(payload.socketId, payload.points); 
  }, [drawOtherUserPoints]);

  const getAllStrokes = useCallback(() => {
     otherUserStrokes.current.clear();
     otherUserTools.current.clear();

     SocketManager.get('strokes').then((data) => {
      if (!data || !data.strokes) return;
      
      data.strokes.forEach((stroke: DrawStroke) => {
        const strokeOptions = {
            strokeColor: stroke.color || '#000',
            strokeWidth: stroke.strokeWidth || 3
        };
        drawOtherUserPoints(stroke.socketId, stroke.points, strokeOptions);
        otherUserStrokes.current.set(stroke.socketId, stroke.points);
      });
    })
  }, [drawOtherUserPoints]);

  // ===================
  // DIMENSIONS & LISTENERS
  // ===================

  const setCanvasDimensions = useCallback(() => {
    if (!canvasRef.current || !parentRef.current) return;

    const dpr = window.devicePixelRatio || 1;
    const parentWidth = parentRef.current?.clientWidth;
    const canvasWidth = parentWidth; 
    const canvasHeight = Math.round(parentWidth * 9 / 16); 

    canvasRef.current.width = dpr * canvasWidth; 
    canvasRef.current.height = dpr * canvasHeight; 

    parentRef.current.style.setProperty('--canvas-width', `${canvasWidth}px`);
    parentRef.current.style.setProperty('--canvas-height', `${canvasHeight}px`);

    canvasDimensions.current = { width: canvasWidth, height: canvasHeight };

    const ctx = canvasRef.current.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr); 
  }, []);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      setCanvasDimensions();
      getAllStrokes(); 
    });
    if (parentRef.current) resizeObserver.observe(parentRef.current);
    return () => resizeObserver.disconnect();
  }, [setCanvasDimensions, getAllStrokes]);

  // ÉCOUTE DES EVENEMENTS SOCKET
  useEffect(() => {
    SocketManager.listen('draw:start', onOtherUserDrawStart)
    SocketManager.listen('draw:move', onOtherUserDrawMove)
    // AJOUT : On écoute l'ordre de tout effacer venant du serveur
    SocketManager.listen('draw:clear', clearCanvas);

    return () => {
      SocketManager.off('draw:start')
      SocketManager.off('draw:move')
      SocketManager.off('draw:clear') // On nettoie l'écouteur
      SocketManager.off('draw:end')
    }
  }, [onOtherUserDrawStart, onOtherUserDrawMove, clearCanvas]);

  useEffect(() => {
    getAllStrokes();
  }, [getAllStrokes]);

  return (
    <div className={[styles.drawArea, 'w-full', 'h-full', 'overflow-hidden', 'flex', 'items-center'].join(' ')} ref={parentRef}>
      <canvas className={[styles.drawArea__canvas, 'border-1'].join(' ')} onMouseDown={onMouseDown} ref={canvasRef}>
      </canvas>
    </div>
  );
}