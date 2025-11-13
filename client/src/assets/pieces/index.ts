import type { Color, PieceType } from "../../types/chess_types";

import whitePawn from "../pieces/white/pawn.svg";
import whiteBishop from "../pieces/white/bishop.svg";
import whiteKnight from "../pieces/white/knight.svg";
import whiteRook from "../pieces/white/rook.svg";
import whiteQueen from "../pieces/white/queen.svg";
import whiteKing from "../pieces/white/king.svg";
import blackPawn from "../pieces/black/pawn.svg";
import blackBishop from "../pieces/black/bishop.svg";
import blackKnight from "../pieces/black/knight.svg";
import blackRook from "../pieces/black/rook.svg";
import blackQueen from "../pieces/black/queen.svg";
import blackKing from "../pieces/black/king.svg";

export const pieceIcons: Record<PieceType, Record<Color, string>> = {
  king: { white: whiteKing, black: blackKing },
  queen: { white: whiteQueen, black: blackQueen },
  rook: { white: whiteRook, black: blackRook },
  bishop: { white: whiteBishop, black: blackBishop },
  knight: { white: whiteKnight, black: blackKnight },
  pawn: { white: whitePawn, black: blackPawn },
};
