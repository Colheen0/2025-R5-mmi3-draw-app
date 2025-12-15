/* @TODO */
export type DrawPoint = {
  x: number;
  y: number;
  strokeWidth: number;
  color: string;
}

export type Point = {
  x: number;
  y: number;
}

export type DrawStroke = {
  socketId: string,
  points: Point[],
  strokeWidth: number,
  color: string,
}

