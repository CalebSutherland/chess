import type { PieceType } from "../types/chess_types";
import type { Piece } from "./piece";
import type { Position } from "./position";

export class Move {
  fromPos: Position;
  toPos: Position;
  promotionPiece?: PieceType;
  capturedPiece?: Piece | null;
  isCastling = false;
  isEnPassant = false;
  movingPiece?: Piece;
  isCheck = false;
  isCheckmate = false;
  disambiguationInfo: { needsFile?: boolean; needsRank?: boolean } = {};

  constructor(fromPos: Position, toPos: Position, promotionPiece?: PieceType) {
    this.fromPos = fromPos;
    this.toPos = toPos;
    this.promotionPiece = promotionPiece;
    this.capturedPiece = null;
  }

  toString(): string {
    return `${this.fromPos} to ${this.toPos}`;
  }

  toSAN(): string {
    if (this.isCastling) {
      return this.toPos.col === 6 ? "O-O" : "O-O-O";
    }

    let san = "";
    const piece = this.movingPiece;

    if (!piece) return this.toString(); // Fallback

    if (piece.pieceType !== "pawn") {
      const pieceLetters: Record<string, string> = {
        king: "K",
        queen: "Q",
        rook: "R",
        bishop: "B",
        knight: "N",
      };
      san += pieceLetters[piece.pieceType] || "";
    }

    // For when multiple of the same type attack the same piece
    if (this.disambiguationInfo.needsFile) {
      san += this.fromPos.toAlgebraic()[0];
    }
    if (this.disambiguationInfo.needsRank) {
      san += this.fromPos.toAlgebraic()[1];
    }

    if (
      piece.pieceType === "pawn" &&
      (this.capturedPiece || this.isEnPassant)
    ) {
      san += this.fromPos.toAlgebraic()[0];
    }

    if (this.capturedPiece || this.isEnPassant) {
      san += "x";
    }

    // destination square
    san += this.toPos.toAlgebraic();

    if (this.promotionPiece && piece.pieceType === "pawn") {
      const promotionLetters: Record<string, string> = {
        queen: "Q",
        rook: "R",
        bishop: "B",
        knight: "N",
      };
      san += "=" + (promotionLetters[this.promotionPiece] || "Q");
    }

    if (this.isCheckmate) {
      san += "#";
    } else if (this.isCheck) {
      san += "+";
    }

    return san;
  }
}
