import type { Board, Color, Piece, Position } from "../types/chess_types";

const isValidPosition = (row: number, col: number) => {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
};

// Simplified move generation for attack checking (no special moves like castling/en passant)
export const generateAttackMoves = (
  row: number,
  col: number,
  piece: Piece,
  board: Board
): Position[] => {
  const moves: Position[] = [];
  const { type, color } = piece;

  const addMove = (r: number, c: number) => {
    if (!isValidPosition(r, c)) {
      return false;
    }
    const target = board[r][c];
    if (!target || target.color !== color) {
      moves.push([r, c]);
      return !target;
    }
    return false;
  };

  switch (type) {
    case "pawn":
      const direction = color === "white" ? -1 : 1;
      // Only diagonal attacks for pawns
      [-1, 1].forEach((dc) => {
        if (
          isValidPosition(row + direction, col + dc) &&
          board[row + direction][col + dc] &&
          board[row + direction][col + dc]?.color != color
        ) {
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

export const generateMoves = (
  row: number,
  col: number,
  piece: Piece,
  board: Board,
  lastMove?: [Position, Position] | null
) => {
  const moves = generateAttackMoves(row, col, piece, board);
  const { type, color } = piece;

  switch (type) {
    case "pawn":
      const direction = color === "white" ? -1 : 1;
      const startRow = color === "white" ? 6 : 1;
      const enPassantRow = color === "white" ? 3 : 4;

      // Forward movement (not in attack moves)
      if (!board[row + direction]?.[col]) {
        moves.push([row + direction, col]);
        if (row === startRow && !board[row + 2 * direction]?.[col]) {
          moves.push([row + 2 * direction, col]);
        }
      }

      // En passant (already have diagonal attacks from generateAttackMoves)
      if (row === enPassantRow && lastMove) {
        const [lastFrom, lastTo] = lastMove;
        const lastPiece = board[lastTo[0]][lastTo[1]];
        if (
          lastPiece?.type === "pawn" &&
          Math.abs(lastFrom[0] - lastTo[0]) === 2 &&
          lastTo[0] === row &&
          Math.abs(lastTo[1] - col) === 1
        ) {
          moves.push([row + direction, lastTo[1]]);
        }
      }
      break;

    case "king":
      // Castling (regular king moves already added by generateAttackMoves)
      if (!piece.hasMoved) {
        const backRank = color === "white" ? 7 : 0;

        // Check king is not currently in check
        if (!isSquareUnderAttack(row, col, color, board)) {
          // Kingside castling
          const kingsideRook = board[backRank][7];
          if (
            kingsideRook?.type === "rook" &&
            kingsideRook.color === color &&
            !kingsideRook.hasMoved &&
            !board[backRank][5] &&
            !board[backRank][6] &&
            !isSquareUnderAttack(backRank, 5, color, board) &&
            !isSquareUnderAttack(backRank, 6, color, board)
          ) {
            moves.push([backRank, 6]);
          }

          // Queenside castling
          const queensideRook = board[backRank][0];
          if (
            queensideRook?.type === "rook" &&
            queensideRook.color === color &&
            !queensideRook.hasMoved &&
            !board[backRank][1] &&
            !board[backRank][2] &&
            !board[backRank][3] &&
            !isSquareUnderAttack(backRank, 3, color, board) &&
            !isSquareUnderAttack(backRank, 2, color, board)
          ) {
            moves.push([backRank, 2]);
          }
        }
      }
      break;

    default:
      break;
  }
  return moves;
};

export const isSquareUnderAttack = (
  row: number,
  col: number,
  defendingColor: Color,
  board: Board
): boolean => {
  const attackingColor = defendingColor === "white" ? "black" : "white";

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === attackingColor) {
        const moves = generateAttackMoves(r, c, piece, board);
        if (moves.some(([mr, mc]) => mr === row && mc === col)) {
          return true;
        }
      }
    }
  }
  return false;
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
  if (!kingPos) return false;

  return isSquareUnderAttack(kingPos[0], kingPos[1], kingColor, board);
};

export const isCheckmate = (
  kingColor: Color,
  board: Board,
  lastMove: [Position, Position] | null
) => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === kingColor) {
        const moves = generateMoves(r, c, piece, board, lastMove);
        for (const [mr, mc] of moves) {
          const newBoard = board.map((row) => [...row]);
          newBoard[mr][mc] = newBoard[r][c];
          newBoard[r][c] = null;
          if (!isInCheck(kingColor, newBoard)) {
            return false;
          }
        }
      }
    }
  }
  return true;
};

export const isStalemate = (
  kingColor: Color,
  board: Board,
  lastMove: [Position, Position] | null
): boolean => {
  // If in check, it's not stalemate
  if (isInCheck(kingColor, board)) {
    return false;
  }

  // Check if the player has any legal moves
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === kingColor) {
        const moves = generateMoves(r, c, piece, board, lastMove);

        // Check if any move is legal (doesn't put king in check)
        for (const [mr, mc] of moves) {
          const testBoard = board.map((row) => [...row]);
          const movingPiece = testBoard[r][c];
          testBoard[mr][mc] = movingPiece;
          testBoard[r][c] = null;

          // Handle en passant in test board
          if (
            movingPiece?.type === "pawn" &&
            Math.abs(mc - c) === 1 &&
            !board[mr][mc]
          ) {
            testBoard[r][mc] = null;
          }

          if (!isInCheck(kingColor, testBoard)) {
            return false; // Found a legal move, not stalemate
          }
        }
      }
    }
  }

  return true; // No legal moves and not in check = stalemate
};
