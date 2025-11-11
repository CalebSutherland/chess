import type { Board, Color, Piece, Position } from "../types/chess_types";

const isValidPosition = (row: number, col: number) => {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
};

export const generateMoves = (
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

      // check if pawn can attack diagnols
      [-1, 1].forEach((dc) => {
        const target = board[row + direction]?.[col + dc];
        if (target && target.color !== color) {
          moves.push([row + direction, col + dc]);
        }
      });
      break;

    case "rook":
      [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].forEach(([dr, dc]) => {
        for (let i = 1; i < 8; i++) {
          if (!addMove(row + dr * i, col + dc * i)) break;
        }
      });
      break;

    case "bishop":
      [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ].forEach(([dr, dc]) => {
        for (let i = 1; i < 8; i++) {
          if (!addMove(row + dr * i, col + dc * i)) break;
        }
      });
      break;

    case "queen":
      [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ].forEach(([dr, dc]) => {
        for (let i = 1; i < 8; i++) {
          if (!addMove(row + dr * i, col + dc * i)) break;
        }
      });
      break;

    case "knight":
      [
        [2, 1],
        [2, -1],
        [-2, 1],
        [-2, -1],
        [1, 2],
        [1, -2],
        [-1, 2],
        [-1, -2],
      ].forEach(([dr, dc]) => {
        addMove(row + dr, col + dc);
      });
      break;

    case "king":
      [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ].forEach(([dr, dc]) => {
        addMove(row + dr, col + dc);
      });
      break;
  }
  return moves;
};

export const findKingPos = (kingColor: Color, board: Board) => {
  let kingPos: Position | null = null;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece?.type === "king" && piece.color === kingColor) {
        kingPos = [r, c];
        break;
      }
    }
    if (kingPos) break;
  }
  return kingPos;
};

export const isInCheck = (kingColor: Color, board: Board) => {
  const kingPos = findKingPos(kingColor, board);

  // check all oppenent pieces moves and see if they attack the king
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color !== kingColor) {
        const moves = generateMoves(r, c, piece, board);
        if (
          moves.some(([mr, mc]) => mr === kingPos![0] && mc === kingPos![1])
        ) {
          return true;
        }
      }
    }
  }
  return false;
};
