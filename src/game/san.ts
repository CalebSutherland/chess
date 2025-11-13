import type { Board, GameState, Piece, Position } from "../types/chess_types";
import { generateMoves } from "./game_logic";

const positionToAlgebraic = (pos: Position): string => {
  const [row, col] = pos;
  const file = String.fromCharCode(97 + col); // a through h
  const rank = (8 - row).toString();
  return file + rank;
};

const getPieceSymbol = (piece: Piece): string => {
  const symbols: Record<string, string> = {
    king: "K",
    queen: "Q",
    rook: "R",
    bishop: "B",
    knight: "N",
    pawn: "", // pawns don't have a symbol in SAN
  };
  return symbols[piece.type];
};

const isCapture = (
  board: Board,
  from: Position,
  to: Position,
  piece: Piece
): boolean => {
  const [toRow, toCol] = to;
  const [_, fromCol] = from;

  if (board[toRow][toCol]) return true;

  // en passant capture
  if (
    piece.type === "pawn" &&
    Math.abs(toCol - fromCol) === 1 &&
    !board[toRow][toCol]
  ) {
    return true;
  }

  return false;
};

const isCastling = (piece: Piece, from: Position, to: Position): boolean => {
  if (piece.type !== "king") return false;
  const [, fromCol] = from;
  const [, toCol] = to;
  return Math.abs(toCol - fromCol) === 2;
};

const isPromotion = (piece: Piece, to: Position, newBoard: Board): boolean => {
  if (piece.type !== "pawn") return false;
  const [toRow, toCol] = to;
  const promotedPiece = newBoard[toRow][toCol];
  return promotedPiece?.type !== "pawn";
};

// handles if two of the same piece on different squares attack the same position
// e.g. two knights on c6 and f5 attack d4 so it will be either Ncxd4 or Nfxd4
// if they are on the same file, like c2 and c6, it will show rank instead so N2xd4 or N6xd4

const handleMultipleAttacks = (
  board: Board,
  piece: Piece,
  from: Position,
  to: Position,
  lastMove: [Position, Position] | null
): string => {
  if (piece.type === "pawn" || piece.type === "king") return "";

  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;

  // find all pieces of same type and color that could move to the same square
  const samePieces: Position[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (r === fromRow && c === fromCol) continue;

      const otherPiece = board[r][c];
      if (
        otherPiece &&
        otherPiece.type === piece.type &&
        otherPiece.color === piece.color
      ) {
        const moves = generateMoves(r, c, otherPiece, board, lastMove);
        if (moves.some(([mr, mc]) => mr === toRow && mc === toCol)) {
          samePieces.push([r, c]);
        }
      }
    }
  }

  if (samePieces.length === 0) return "";

  // check if file disambiguation is enough
  const sameFile = samePieces.some(([, c]) => c === fromCol);
  const sameRank = samePieces.some(([r]) => r === fromRow);

  if (!sameFile) {
    return String.fromCharCode(97 + fromCol); // file letter
  } else if (!sameRank) {
    return (8 - fromRow).toString(); // rank number
  } else {
    return positionToAlgebraic(from); // full square notation
  }
};

// convert a single move to SAN notation
export const moveToSAN = (
  prevState: GameState,
  currentState: GameState
): string => {
  const { board: prevBoard, lastMove: prevLastMove } = prevState;
  const { board: currentBoard, lastMove, inCheck, checkMate } = currentState;

  if (!lastMove) return "";

  const [from, to] = lastMove;
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;

  const piece = prevBoard[fromRow][fromCol];
  if (!piece) return "";

  if (isCastling(piece, from, to)) {
    const [, toCol] = to;
    return toCol === 6 ? "O-O" : "O-O-O";
  }

  let notation = "";
  notation += getPieceSymbol(piece);
  notation += handleMultipleAttacks(prevBoard, piece, from, to, prevLastMove);

  const capture = isCapture(prevBoard, from, to, piece);
  if (capture) {
    if (piece.type === "pawn") {
      notation += String.fromCharCode(97 + fromCol);
    }
    notation += "x";
  }

  notation += positionToAlgebraic(to);

  if (isPromotion(piece, to, currentBoard)) {
    const promotedPiece = currentBoard[toRow][toCol];
    if (promotedPiece) {
      notation += "=" + getPieceSymbol(promotedPiece);
    }
  }

  if (checkMate) {
    notation += "#";
  } else if (inCheck) {
    notation += "+";
  }

  return notation;
};

export const historyToSAN = (history: GameState[]): string[] => {
  const moves: string[] = [];

  for (let i = 1; i < history.length; i++) {
    const san = moveToSAN(history[i - 1], history[i]);
    if (san) {
      moves.push(san);
    }
  }

  return moves;
};

// get move pairs for display returns array of {moveNumber, white, black}
export const getMovePairs = (
  history: GameState[]
): {
  moveNumber: number;
  white: string;
  black: string | null;
}[] => {
  const moves = historyToSAN(history);
  const pairs: { moveNumber: number; white: string; black: string | null }[] =
    [];

  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1] || null,
    });
  }

  return pairs;
};
