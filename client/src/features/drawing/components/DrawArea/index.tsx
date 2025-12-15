import { useCallback, useEffect, useMemo, useRef } from "react";
import { getCoordinatesRelativeToElement } from "../../utils/getCanvasCoordinates";
import { useMyUserStore } from "../../../user/store/useMyUserStore";
import styles from './DrawArea.module.css';

/**
 * EN SAVOIR PLUS : 
 * DPR : https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
 * ResizeObserver : https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
 */

export function DrawArea() {
  /**
   * ===================
   * ETATS & REFS (toujours les définir en haut du composant)
   * ===================
   * 
  */
   
  /**
   * Rappel : Les modifications de state impliquent un re-render alors que les ref ne provoquent AUCUN re-render (c'est pour ça qu'on ne les ajoute pas dans les dépendances d'un hook par exemple)
   * 
  */ 

  /**
   * On utilise des refs ici, car on ne veut surtout pas provoquer de re-render à chaque fois qu'on a une modification de tracé
   * Ici, on va donc pouvoir stocker les informations dont on a besoin, sans provoquer aucun re-rendu
  */
  const canvasRef = useRef<HTMLCanvasElement>(null); /** Les updates sur ces constantes ne provoqueront pas re-render */
  const parentRef = useRef<HTMLDivElement>(null); /** Les updates sur ces constantes ne provoqueront pas re-render */

  const { myUser } = useMyUserStore();
  const canUserDraw = useMemo(() => myUser !== null, [myUser]); 
  
  /**
   * ===================
   * GESTION COORDONNEES
   * ===================
   */

  /** Pour récupérer les coordonnées d'un event en prenant en compte le placement de notre canvas */
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    return getCoordinatesRelativeToElement(e.clientX, e.clientY, canvasRef.current);
  } 

  /**
   * Conseil @todo: 
   * Faîtes une fontion qui va venir dessiner en fonction de coordonées que vous passez
   */

  /**
   * ===================
   * GESTION DES EVENEMENTS MOUSE
   * ===================
   */
  
  const onMouseMove = useCallback((e: MouseEvent) => {
    console.log('onMouseMove', e);
  }, []);

  const onMouseUp = useCallback((e: MouseEvent) => {
    console.log('onMouseUp', e);
  }, []);

  const onMouseDown: React.MouseEventHandler<HTMLCanvasElement> = useCallback((e) => {
    /** On empêche à l'utilisateur de dessiner tant qu'il n'a pas rejoint le serveur  */
    if (!canUserDraw) { return; }

    /** Récupération du contexte 2d du canvas */
    const canvas = e.currentTarget;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    /** Transformation des coordoonées mouse (relatives à la page) vers des coordonnées relative au canvas  */
    const coordinates = getCanvasCoordinates(e);

    /** Ressource: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API */
    /** On commence par un "beginPath" pour débuter le tracé */
    ctx.beginPath();

    /** Dans ce 1er exemple (on changera par la suite), j'affiche des points là où je fais un mousedown, donc j'ai choisi d'utiliser la méthode arc : https://developer.mozilla.org/fr/docs/Web/API/CanvasRenderingContext2D/arc */
    ctx.arc(coordinates.x, coordinates.y, 2, 0, Math.PI * 2);
    ctx.fill();

    /**
    * On pourrait ajouter le onMouseMove, onMouseUp directement dans le JSX de notre canvas, mais les ajouter à la volée ici est plus flexible. On pourra retirer ces events onMouseUp
    * Cela évite aussi les re-render inutile
    */
    canvasRef.current?.addEventListener('mousemove', onMouseMove);
    canvasRef.current?.addEventListener('mouseup', onMouseUp);
  }, [canUserDraw, onMouseMove, onMouseUp]);

  /**
   * ===================
   * GESTION DES DPR
   * ===================
   */

  /**
   * setCanvasDimensions : Configure les dimensions du canvas avec DPR
   */
  const setCanvasDimensions = useCallback(() => {
    if (!canvasRef.current || !parentRef.current) return;

    /** On va utiliser le ratio de pixel de l'écran pour avoir un rendu net  (DPR = 3|2|1) et par défaut on sera toujours à 1 */
    const dpr = window.devicePixelRatio || 1;

    /** On définit la taille réelle interne du canvas en se basant sur les DPR  */
    const parentWidth = parentRef.current?.clientWidth;
    const canvasWidth = parentWidth; /** On veut remplir 100% de la largeur de l'élément parent */
    const canvasHeight = Math.round(parentWidth * 9 / 16); /** On veut un ratio 16/9 par rapport à la largeur */

    canvasRef.current.width = dpr * canvasWidth; /** On multiplie la largeur souhaitée par le nb de dpr */
    canvasRef.current.height = dpr * canvasHeight; /** On multiplie la hauteur souhaitée par le nb de dpr */

    /**  On définit ensuite la taille en CSS, visible par l'utilisateur  */
    
    parentRef.current.style.setProperty('--canvas-width', `${canvasWidth}px`);
    parentRef.current.style.setProperty('--canvas-height', `${canvasHeight}px`);

    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      /** On scale en prenant compte les dpr */
      ctx.scale(dpr, dpr); 
    }
  }, []);

  /**
   * ===================
   * GESTION DU RESIZE
   * ===================
  */


  useEffect(() => {
    /**
     * On souhaite redimensionner le canvas et recharger les strokes au resize
     */
    const resizeObserver = new ResizeObserver(() => {
      setCanvasDimensions();
    });
    
    /** On observe les changements de taille sur l'élément parent */
    if (parentRef.current) {
      resizeObserver.observe(parentRef.current);
    }

    /** 
     * Rappel : Il s'agit d'une fonction de cleanup (dans le useEffect le cleanup est optionnel). A chaque fois qu'un re-rendu est effectué, le cleanup est d'abord effectué avant de re ré-effectuer le useEffect classique. Elle est également appelée lorsque le component est removed du DOM. 
     */
    return () => {
      /** On veut disconnect pour éviter d'avoir plusieurs resizeObservers ou d'avoir un resizeObserver sur un élément qui n'existe plus  */
      resizeObserver.disconnect();
    };

  }, [setCanvasDimensions]);

  return (
    <div className={[styles.drawArea, 'w-full', 'h-full', 'overflow-hidden', 'flex', 'items-center'].join(' ')} ref={parentRef}>
      <canvas className={[styles.drawArea__canvas, 'border-1'].join(' ')} onMouseDown={onMouseDown} ref={canvasRef}
      >
      </canvas>
    </div>
  )
}