import type { PieceType } from "../types/chess_types";
import { Board } from "./board";
import { Pawn, Queen, Rook, Bishop, Knight } from "./piece";
import { Position } from "./position";

export class SpecialMoveHandler {
  static performCastling(
    board: Board,
    kingPos: Position,
    kingTarget: Position
  ): void {
    const backRank = kingPos.row;
    board.movePiece(kingPos, kingTarget);

    if (kingTarget.col === 6) {
      board.movePiece(new Position(backRank, 7), new Position(backRank, 5));
    } else {
      board.movePiece(new Position(backRank, 0), new Position(backRank, 3));
    }
  }

  static performEnPassant(
    board: Board,
    fromPos: Position,
    toPos: Position
  ): void {
    board.movePiece(fromPos, toPos);
    board.setPiece(new Position(fromPos.row, toPos.col), null);
  }

  static promotePawnIfNeeded(
    board: Board,
    pos: Position,
    pawn: Pawn,
    pieceType?: PieceType
  ): void {
    const promotionRow = pawn.color === "white" ? 0 : 7;
    if (pos.row !== promotionRow) return;

    const pieceMap = {
      queen: Queen,
      rook: Rook,
      bishop: Bishop,
      knight: Knight,
    };
    const PieceClass = pieceMap[pieceType as keyof typeof pieceMap] || Queen;
    const newPiece = new PieceClass(pawn.color, true);
    board.setPiece(pos, newPiece);
  }
}
