import { useCallback, useEffect, useMemo, useRef } from "react";
import { getCoordinatesRelativeToElement } from "../../utils/getCanvasCoordinates";
import { useMyUserStore } from "../../../user/store/useMyUserStore";
import styles from './DrawArea.module.css';
import { SocketManager } from "../../../../shared/services/SocketManager";
import type { DrawStroke } from "../../../../shared/types/drawing.type";
import type { Point } from "../../../../shared/types/drawing.type";

// 1. Définition de l'interface pour la réponse du serveur
interface StrokesResponse {
  strokes: DrawStroke[];
}

export function DrawArea() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const otherUserStrokes = useRef<Map<string, Point[]>>(new Map());
  const canvasCssDimensions = useRef({ width: 0, height: 0 }); 

  const { myUser } = useMyUserStore();
  const canUserDraw = useMemo(() => myUser !== null, [myUser]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
    return getCoordinatesRelativeToElement(e.clientX, e.clientY, canvasRef.current);
  }

  const drawLine = useCallback((
    from: { x: number, y: number },
    to: { x: number, y: number }
  ) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }, []);

  // --- GESTION EVENTS MOUSE ---
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const pointsRef = useRef<Array<{ x: number; y: number }>>([]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDrawingRef.current) { return; }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    const lastX = lastPosRef.current.x;
    const lastY = lastPosRef.current.y;

    drawLine({ x: lastX, y: lastY }, { x: currentX, y: currentY });

    pointsRef.current.push({ x: currentX, y: currentY });
    lastPosRef.current = { x: currentX, y: currentY };

    const dimensions = canvasCssDimensions.current;
    // Sécurité pour éviter la division par 0
    if (dimensions.width > 0 && dimensions.height > 0) {
      const normalizedX = currentX / dimensions.width;
      const normalizedY = currentY / dimensions.height;
      SocketManager.emit('draw:move', { x: normalizedX, y: normalizedY });
    }
  }, [drawLine]);

  const onMouseUp = useCallback((e: MouseEvent) => {
    console.log(e, 'mouseup');
    isDrawingRef.current = false;
    SocketManager.emit('draw:end');
  }, []);

  const onMouseDown: React.MouseEventHandler<HTMLCanvasElement> = useCallback((e) => {
    isDrawingRef.current = true;
    if (!canUserDraw) { return; }
    const canvas = e.currentTarget;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coordinates = getCanvasCoordinates(e);
    lastPosRef.current = { x: coordinates.x, y: coordinates.y };

    const dimensions = canvasCssDimensions.current;
    if (dimensions.width > 0 && dimensions.height > 0) {
      const normalizedX = coordinates.x / dimensions.width;
      const normalizedY = coordinates.y / dimensions.height;
      SocketManager.emit('draw:start', {
        x: normalizedX,
        y: normalizedY,
        color: '#000',
        strokeWidth: 2,
      });
    }

    canvasRef.current?.addEventListener('mousemove', onMouseMove);
    canvasRef.current?.addEventListener('mouseup', onMouseUp);
  }, [canUserDraw, onMouseMove, onMouseUp]);

  // --- CONFIGURATION CANVAS ---
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
    
    canvasCssDimensions.current = { width: canvasWidth, height: canvasHeight };

    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, []);

  // --- DESSIN DES AUTRES UTILISATEURS ---
  const drawOtherUserPoints = useCallback((socketId: string, points: Point[]) => {
    if (!canvasRef.current) return;
    
    const canvasWidth = canvasRef.current.clientWidth;
    const canvasHeight = canvasRef.current.clientHeight;
    // Si la taille est 0 (ex: chargement), on ne dessine pas pour éviter les bugs
    if (canvasWidth === 0 || canvasHeight === 0) return;

    const previousPoints = otherUserStrokes.current.get(socketId) || [];
    
    points.forEach((point, index) => {
      if (index < previousPoints.length) {
        return; 
      }
      
      const to = { 
          x: point.x * canvasWidth, 
          y: point.y * canvasHeight 
      };

      let from;
      if (index === 0) {
        from = to;
      } else {
        const prevPoint = points[index - 1];
        from = {
          x: prevPoint.x * canvasWidth,
          y: prevPoint.y * canvasHeight,
        };
      }

      drawLine(from, to);
    });
  }, [drawLine]);

  // 2. FONCTION POUR TOUT REDESSINER (Appelée au resize)
  const redrawAllStrokes = useCallback(async () => {
      // On vide la mémoire locale des "strokes déjà dessinés" pour forcer le redessin
      otherUserStrokes.current.clear();

      try {
        // On récupère tout depuis le serveur (ou un store local si vous en avez un)
        const data = await SocketManager.get('strokes') as StrokesResponse;
        
        if (!data || !data.strokes) return;

        data.strokes.forEach((stroke) => {
            // On remplit la ref
            otherUserStrokes.current.set(stroke.socketId, stroke.points);
            // On force le dessin en passant TOUS les points
            // Note: drawOtherUserPoints va comparer avec otherUserStrokes, 
            // mais comme on vient de set la map juste au dessus, il faut ruser ou adapter drawOtherUserPoints.
            // LE PLUS SIMPLE ICI : On appelle drawLine manuellement pour tout redessiner.
            
            // Pour simplifier, on va vider la map juste avant d'appeler la fonction de dessin 
            // pour qu'elle croit que rien n'est dessiné.
            otherUserStrokes.current.delete(stroke.socketId); 
            drawOtherUserPoints(stroke.socketId, stroke.points);
            
            // Et on remet à jour la map
            otherUserStrokes.current.set(stroke.socketId, stroke.points);
        });
      } catch (err) {
          console.error("Erreur redraw", err);
      }
  }, [drawOtherUserPoints]);

  const onOtherUserDrawStart = useCallback((payload: DrawStroke) => {
    drawOtherUserPoints(payload.socketId, payload.points);
    otherUserStrokes.current.set(payload.socketId, payload.points);
  }, [drawOtherUserPoints]);

  const onOtherUserDrawMove = useCallback((payload: DrawStroke) => {
    drawOtherUserPoints(payload.socketId, payload.points);
    otherUserStrokes.current.set(payload.socketId, payload.points); // Important de mettre à jour le stroke complet
  }, [drawOtherUserPoints]);

  const onOtherUserDrawEnd = useCallback((payload: DrawStroke) => {
    otherUserStrokes.current.delete(payload.socketId);
     // Optionnel : Nettoyage
  }, []);

  // --- LISTENERS SOCKET ---
  useEffect(() => {
    SocketManager.listen('draw:start', onOtherUserDrawStart);
    SocketManager.listen('draw:move', onOtherUserDrawMove);
    SocketManager.listen('draw:end', onOtherUserDrawEnd);

    return () => {
      SocketManager.off('draw:start');
      SocketManager.off('draw:move');
      SocketManager.off('draw:end');
    }
  }, [onOtherUserDrawEnd, onOtherUserDrawMove, onOtherUserDrawStart]);


  // --- RESIZE OBSERVER ---
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      setCanvasDimensions();
      // 3. IMPORTANT : On redessine tout après avoir changé la taille
      redrawAllStrokes();
    });

    if (parentRef.current) {
      resizeObserver.observe(parentRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [setCanvasDimensions, redrawAllStrokes]);


  // 4. CHARGEMENT INITIAL (Corrigé)
  useEffect(() => {
    // On utilise simplement la fonction qu'on a créée pour le resize, elle fait la même chose
    redrawAllStrokes(); 
  }, [redrawAllStrokes]);


  return (
    <div className={[styles.drawArea, 'w-full', 'h-full', 'overflow-hidden', 'flex', 'items-center'].join(' ')} ref={parentRef}>
      <canvas className={[styles.drawArea__canvas, 'border-1'].join(' ')} onMouseDown={onMouseDown} ref={canvasRef} />
    </div>
  )
}