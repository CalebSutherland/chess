export type PositionData = {
  row: number;
  col: number;
};

export type MoveData = {
  from_pos: PositionData;
  to_pos: PositionData;
};

export type PieceType =
  | "king"
  | "queen"
  | "rook"
  | "bishop"
  | "knight"
  | "pawn";
export type Color = "white" | "black";
export type GameStatus = "active" | "checkmate" | "stalemate" | "draw";

export type PieceData = {
  type: PieceType;
  color: Color;
  hasMoved: boolean;
};
export type BoardData = (PieceData | null)[][];

export type HistoryData = {
  status: GameStatus;
  board: BoardData;
};
