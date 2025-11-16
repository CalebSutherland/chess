import type { Color, GameStatus, PieceType } from "../types/chess_types";
import type { Board } from "./board";
import type { Piece } from "./piece";

export type BoardGrid = (Piece | null)[][];

export type GameHistory = {
  status: GameStatus;
  board: Board;
};

export interface GameStateDTO {
  board: BoardStateDTO;
  currentTurn: Color;
  status: GameStatus;
  moveHistory: MoveDTO[];
  initialFEN: string;
  currentMoveIndex: number;
}

export interface BoardStateDTO {
  pieces: Array<{
    position: { row: number; col: number };
    type: PieceType;
    color: Color;
    hasMoved: boolean;
  }>;
}

export interface MoveDTO {
  from: { row: number; col: number };
  to: { row: number; col: number };
  promotion?: PieceType;
  timestamp?: number;
  playerId?: string;
}

export interface MoveRequestDTO {
  gameId: string;
  playerId: string;
  move: MoveDTO;
}

export interface MoveResponseDTO {
  success: boolean;
  gameState?: GameStateDTO;
  error?: string;
  legalMoves?: Array<{ row: number; col: number }>;
}
