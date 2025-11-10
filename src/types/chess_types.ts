type PieceType = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";
type Color = "white" | "black";

export interface Piece {
  type: PieceType;
  color: Color;
}

export type Board = (Piece | null)[][];
export type Position = [number, number];
