import { useCallback } from "react"

export function DrawArea() {

const onMouseDown: React.MouseEventHandler<HTMLCanvasElement> = useCallback((e) => {
  const ctx = e.currentTarget.getContext("2d")
  const locaY = e.nativeEvent.offsetY;
  const locaX = e.nativeEvent.offsetX;

  ctx!.fillStyle = "cyan"
  ctx?.fillRect(locaX, locaY, 10, 10)
  console.log("Mouse down on canvas",e, e.currentTarget )
}, [])

const onMouseUp = useCallback(() => {
  console.log("Mouse up on canvas")
  
}, [])

const onMouseMove: React.MouseEventHandler<HTMLCanvasElement> = useCallback((e) => {
  console.log("Mouse move", e.nativeEvent.offsetX, e.nativeEvent.offsetY);
}, [])

  return (
  <div>
    <canvas width="1000" height="400" className="border-1 w-full" onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseMove={onMouseMove} />
  </div>
  )
}