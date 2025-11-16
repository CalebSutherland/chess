import { Game } from "./game";
import { King, Pawn, Piece, Rook } from "./piece";
import { Position } from "./position";

export class MoveValidator {
  private game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  getLegalMoves(position: Position): Position[] {
    if (!this.game.canMakeMove()) return [];

    const piece = this.game.Board.getPiece(position);
    if (!piece || piece.color !== this.game.CurrentTurn) return [];

    const possibleMoves = piece.getPossibleMoves(position, this.game.Board);

    if (piece instanceof King) {
      possibleMoves.push(...this.getCastlingMoves(position));
    } else if (piece instanceof Pawn) {
      possibleMoves.push(...this.getEnPassantMoves(position));
    }

    return possibleMoves.filter((movePos) =>
      this.isLegalMove(position, movePos)
    );
  }

  private isLegalMove(fromPos: Position, toPos: Position): boolean {
    const testBoard = this.game.Board.clone();
    testBoard.movePiece(fromPos, toPos);

    const piece = this.game.Board.getPiece(fromPos);
    if (piece instanceof Pawn) {
      if (
        Math.abs(toPos.col - fromPos.col) === 1 &&
        !this.game.Board.getPiece(toPos)
      ) {
        testBoard.setPiece(new Position(fromPos.row, toPos.col), null);
      }
    }

    return !testBoard.isInCheck(this.game.CurrentTurn);
  }

  getDisambiguationInfo(
    fromPos: Position,
    toPos: Position,
    piece: Piece
  ): { needsFile?: boolean; needsRank?: boolean } {
    if (piece instanceof Pawn || piece instanceof King) return {};

    const sameTypePieces = this.game.Board.getAllPieces(piece.color).filter(
      ([pos, p]) => {
        if (p.pieceType !== piece.pieceType) return false;
        if (pos.row === fromPos.row && pos.col === fromPos.col) return false;
        const legalMoves = this.getLegalMoves(pos);
        return legalMoves.some(
          (m) => m.row === toPos.row && m.col === toPos.col
        );
      }
    );

    if (sameTypePieces.length === 0) return {};

    const sameFile = sameTypePieces.some(([pos]) => pos.col === fromPos.col);
    const sameRank = sameTypePieces.some(([pos]) => pos.row === fromPos.row);

    if (!sameFile) return { needsFile: true };
    if (!sameRank) return { needsRank: true };
    return { needsFile: true, needsRank: true };
  }

  private getCastlingMoves(kingPos: Position): Position[] {
    const moves: Position[] = [];
    const king = this.game.Board.getPiece(kingPos);
    if (!(king instanceof King) || king.hasMoved) return moves;
    if (this.game.Board.isInCheck(this.game.CurrentTurn)) return moves;

    const backRank = this.game.CurrentTurn === "white" ? 7 : 0;
    const opponentColor = this.game.CurrentTurn === "white" ? "black" : "white";

    // kingside
    const kingsideRook = this.game.Board.getPiece(new Position(backRank, 7));
    if (kingsideRook instanceof Rook && !kingsideRook.hasMoved) {
      if (
        !this.game.Board.getPiece(new Position(backRank, 5)) &&
        !this.game.Board.getPiece(new Position(backRank, 6)) &&
        !this.game.Board.isSquareUnderAttack(
          new Position(backRank, 5),
          opponentColor
        ) &&
        !this.game.Board.isSquareUnderAttack(
          new Position(backRank, 6),
          opponentColor
        )
      ) {
        moves.push(new Position(backRank, 6));
      }
    }

    // queenside
    const queensideRook = this.game.Board.getPiece(new Position(backRank, 0));
    if (queensideRook instanceof Rook && !queensideRook.hasMoved) {
      if (
        !this.game.Board.getPiece(new Position(backRank, 1)) &&
        !this.game.Board.getPiece(new Position(backRank, 2)) &&
        !this.game.Board.getPiece(new Position(backRank, 3)) &&
        !this.game.Board.isSquareUnderAttack(
          new Position(backRank, 2),
          opponentColor
        ) &&
        !this.game.Board.isSquareUnderAttack(
          new Position(backRank, 3),
          opponentColor
        )
      ) {
        moves.push(new Position(backRank, 2));
      }
    }

    return moves;
  }

  private getEnPassantMoves(pawnPos: Position): Position[] {
    const moves: Position[] = [];
    const lastMove = this.game.LastMove;
    const pawn = this.game.Board.getPiece(pawnPos);
    if (!lastMove || !(pawn instanceof Pawn)) return moves;

    const enPassantRow = pawn.color === "white" ? 3 : 4;
    if (pawnPos.row !== enPassantRow) return moves;

    const lastMovedPiece = this.game.Board.getPiece(lastMove.toPos);
    if (
      lastMovedPiece instanceof Pawn &&
      Math.abs(lastMove.fromPos.row - lastMove.toPos.row) === 2 &&
      lastMove.toPos.row === pawnPos.row &&
      Math.abs(lastMove.toPos.col - pawnPos.col) === 1
    ) {
      const direction = pawn.color === "white" ? -1 : 1;
      moves.push(new Position(pawnPos.row + direction, lastMove.toPos.col));
    }

    return moves;
  }
}
