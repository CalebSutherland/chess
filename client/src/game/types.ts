import type { GameStatus } from "../types/chess_types";
import type { Board } from "./board";
import type { Piece } from "./piece";

export type BoardGrid = (Piece | null)[][];

export type GameHistory = {
  status: GameStatus;
  board: Board;
};
