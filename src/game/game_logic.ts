import type { Board, Piece, Position } from "../types/chess_types";

const isValidPosition = (row: number, col: number) => {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
};

export const generate_moves = (
  row: number,
  col: number,
  piece: Piece,
  board: Board
) => {
  const moves: Position[] = [];
  const { type, color } = piece;

  const addMove = (r: number, c: number) => {
    if (!isValidPosition(r, c)) {
      return false;
    }
    const target = board[r][c];

    // if empty sqaure or oppenent peice
    if (!target || target.color !== color) {
      moves.push([r, c]);
      return !target;
    }
    return false;
  };

  switch (type) {
    case "pawn":
      const direction = color === "white" ? -1 : 1;
      const startRow = color === "white" ? 6 : 1;

      if (!board[row + direction]?.[col]) {
        moves.push([row + direction, col]);
        if (row == startRow && !board[row + 2 * direction]?.[col]) {
          moves.push([row + 2 * direction, col]);
        }
      }

      [-1, 1].forEach((dc) => {
        const target = board[row + direction]?.[col + dc];
        if (target && target.color !== color) {
          moves.push([row + direction, col + dc]);
        }
      });
      break;
  }
  return moves;
};
