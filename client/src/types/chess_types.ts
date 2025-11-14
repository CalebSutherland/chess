export type PieceType =
  | "king"
  | "queen"
  | "rook"
  | "bishop"
  | "knight"
  | "pawn";
export type Color = "white" | "black";

export interface Piece {
  type: PieceType;
  color: Color;
  hasMoved: boolean;
}

export type Board = (Piece | null)[][];
export type Position = [number, number];

export type GameState = {
  board: Board;
  lastMove: [Position, Position] | null;
  currentTurn: Color;
  inCheck: Color | null;
  checkMate: boolean;
  stalemate: boolean;
};

export type MoveResult = {
  board: Board;
  lastMove: [Position, Position];
  promotionPending?: { position: Position; color: Color };
};
