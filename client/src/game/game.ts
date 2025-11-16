import { Board } from "./board";
import { Position } from "./position";
import { Move } from "./move";
import { Piece, Pawn, King, Queen, Rook, Bishop, Knight } from "./piece";
import type {
  Color,
  PieceType,
  GameStatus,
  PositionData,
  HistoryData,
} from "../types/chess_types";
import type { GameHistory } from "./types";

export class Game {
  initialFEN: string;
  board: Board;
  currentTurn: Color;
  moveHistory: Move[];
  status: GameStatus;
  gameHistory: GameHistory[];
  currentHistoryIndex: number;

  constructor(fen: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR") {
    this.initialFEN = fen;
    this.board = new Board(fen);
    this.currentTurn = "white";
    this.moveHistory = [];
    this.status = "active";
    this.gameHistory = [
      {
        status: this.status,
        board: this.board.clone(),
      },
    ];
    this.currentHistoryIndex = 0;
  }

  get lastMove(): Move | undefined {
    if (this.currentHistoryIndex === 0) return undefined;
    return this.moveHistory[this.currentHistoryIndex - 1];
  }

  getLegalMoves(position: Position): Position[] {
    const piece = this.board.getPiece(position);
    if (!piece || piece.color !== this.currentTurn) return [];

    const possibleMoves = piece.getPossibleMoves(position, this.board);

    if (piece instanceof King)
      possibleMoves.push(...this.getCastlingMoves(position));
    else if (piece instanceof Pawn)
      possibleMoves.push(...this.getEnPassantMoves(position));

    return possibleMoves.filter((movePos) =>
      this.isLegalMove(position, movePos)
    );
  }

  serializeLegalMoves(position: Position): PositionData[] {
    const legalMoves = this.getLegalMoves(position);
    return legalMoves.map((pos) => pos.serializePosition());
  }

  private isLegalMove(fromPos: Position, toPos: Position): boolean {
    const testBoard = this.board.clone();
    testBoard.movePiece(fromPos, toPos);

    const piece = this.board.getPiece(fromPos);
    if (piece instanceof Pawn) {
      if (
        Math.abs(toPos.col - fromPos.col) === 1 &&
        !this.board.getPiece(toPos)
      ) {
        // En passant capture
        testBoard.setPiece(new Position(fromPos.row, toPos.col), null);
      }
    }

    return !testBoard.isInCheck(this.currentTurn);
  }

  makeMove(
    fromPos: Position,
    toPos: Position,
    promotionPiece?: PieceType
  ): boolean {
    const piece = this.board.getPiece(fromPos);
    if (!piece || piece.color !== this.currentTurn) return false;

    const legalMoves = this.getLegalMoves(fromPos);
    if (!legalMoves.some((p) => p.row === toPos.row && p.col === toPos.col))
      return false;

    // if not at the end of history truncate future moves
    if (this.currentHistoryIndex < this.gameHistory.length - 1) {
      this.gameHistory = this.gameHistory.slice(
        0,
        this.currentHistoryIndex + 1
      );
      this.moveHistory = this.moveHistory.slice(0, this.currentHistoryIndex);
    }

    const move = new Move(fromPos, toPos, promotionPiece);
    move.movingPiece = Object.assign(
      Object.create(Object.getPrototypeOf(piece)),
      piece
    );
    move.disambiguationInfo = this.getDisambiguationInfo(fromPos, toPos, piece);

    if (piece instanceof King && Math.abs(toPos.col - fromPos.col) === 2) {
      this.performCastling(fromPos, toPos);
      move.isCastling = true;
    }
    // en passant
    else if (
      piece instanceof Pawn &&
      Math.abs(toPos.col - fromPos.col) === 1 &&
      !this.board.getPiece(toPos)
    ) {
      this.performEnPassant(fromPos, toPos);
      move.isEnPassant = true;
    }
    // regular move
    else {
      move.capturedPiece = this.board.movePiece(fromPos, toPos);
    }

    if (piece instanceof Pawn) {
      const promotionRow = piece.color === "white" ? 0 : 7;
      if (toPos.row === promotionRow) {
        this.promotePawn(toPos, promotionPiece || "queen");
      }
    }

    this.currentTurn = this.currentTurn === "white" ? "black" : "white";
    this.moveHistory.push(move);
    this.gameHistory.push({ status: this.status, board: this.board.clone() });
    this.currentHistoryIndex = this.gameHistory.length - 1;

    this.updateGameStatus();

    move.isCheck = this.board.isInCheck(this.currentTurn);
    move.isCheckmate = this.status === "checkmate";

    return true;
  }

  jumpToMove(index: number): boolean {
    if (index < 0 || index >= this.gameHistory.length) return false;

    this.currentHistoryIndex = index;
    const historyState = this.gameHistory[index];

    this.board = historyState.board.clone();
    this.status = historyState.status;

    this.currentTurn = index % 2 === 0 ? "white" : "black";

    return true;
  }

  undo(): boolean {
    if (this.currentHistoryIndex <= 0) return false;
    return this.jumpToMove(this.currentHistoryIndex - 1);
  }

  redo(): boolean {
    if (this.currentHistoryIndex >= this.gameHistory.length - 1) return false;
    return this.jumpToMove(this.currentHistoryIndex + 1);
  }

  canUndo(): boolean {
    return this.currentHistoryIndex > 0;
  }

  canRedo(): boolean {
    return this.currentHistoryIndex < this.gameHistory.length - 1;
  }

  isAtCurrentPosition(): boolean {
    return this.currentHistoryIndex === this.gameHistory.length - 1;
  }

  getCurrentMoveNumber(): number {
    return this.currentHistoryIndex;
  }

  getTotalMoves(): number {
    return this.gameHistory.length - 1;
  }

  getCurrentMove(): Move | null {
    if (this.currentHistoryIndex === 0) return null;
    return this.moveHistory[this.currentHistoryIndex - 1];
  }

  private getCastlingMoves(kingPos: Position): Position[] {
    const moves: Position[] = [];
    const king = this.board.getPiece(kingPos);
    if (!(king instanceof King) || king.hasMoved) return moves;
    if (this.board.isInCheck(this.currentTurn)) return moves;

    const backRank = this.currentTurn === "white" ? 7 : 0;

    // kingside
    const kingsideRook = this.board.getPiece(new Position(backRank, 7));
    if (kingsideRook instanceof Rook && !kingsideRook.hasMoved) {
      if (
        !this.board.getPiece(new Position(backRank, 5)) &&
        !this.board.getPiece(new Position(backRank, 6)) &&
        !this.board.isSquareUnderAttack(
          new Position(backRank, 5),
          this.currentTurn === "white" ? "black" : "white"
        ) &&
        !this.board.isSquareUnderAttack(
          new Position(backRank, 6),
          this.currentTurn === "white" ? "black" : "white"
        )
      ) {
        moves.push(new Position(backRank, 6));
      }
    }

    // queenside
    const queensideRook = this.board.getPiece(new Position(backRank, 0));
    if (queensideRook instanceof Rook && !queensideRook.hasMoved) {
      if (
        !this.board.getPiece(new Position(backRank, 1)) &&
        !this.board.getPiece(new Position(backRank, 2)) &&
        !this.board.getPiece(new Position(backRank, 3)) &&
        !this.board.isSquareUnderAttack(
          new Position(backRank, 2),
          this.currentTurn === "white" ? "black" : "white"
        ) &&
        !this.board.isSquareUnderAttack(
          new Position(backRank, 3),
          this.currentTurn === "white" ? "black" : "white"
        )
      ) {
        moves.push(new Position(backRank, 2));
      }
    }

    return moves;
  }

  private performCastling(kingPos: Position, kingTarget: Position) {
    const backRank = kingPos.row;
    this.board.movePiece(kingPos, kingTarget);

    if (kingTarget.col === 6) {
      // kingside
      this.board.movePiece(
        new Position(backRank, 7),
        new Position(backRank, 5)
      );
    } else {
      // queenside
      this.board.movePiece(
        new Position(backRank, 0),
        new Position(backRank, 3)
      );
    }
  }

  private getEnPassantMoves(pawnPos: Position): Position[] {
    const moves: Position[] = [];
    const lastMove = this.lastMove;
    const pawn = this.board.getPiece(pawnPos);
    if (!lastMove || !(pawn instanceof Pawn)) return moves;

    const enPassantRow = pawn.color === "white" ? 3 : 4;
    if (pawnPos.row !== enPassantRow) return moves;

    const lastMovedPiece = this.board.getPiece(lastMove.toPos);
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

  private performEnPassant(fromPos: Position, toPos: Position) {
    this.board.movePiece(fromPos, toPos);
    this.board.setPiece(new Position(fromPos.row, toPos.col), null);
  }

  private promotePawn(pos: Position, pieceType: PieceType) {
    const pawn = this.board.getPiece(pos);
    if (!(pawn instanceof Pawn)) return;

    const pieceMap: Record<
      PieceType,
      new (color: Color, hasMoved?: boolean) => Piece
    > = {
      queen: Queen,
      rook: Rook,
      bishop: Bishop,
      knight: Knight,
      king: King,
      pawn: Pawn,
    };

    const PieceClass = pieceMap[pieceType] || Queen;
    const newPiece = new PieceClass(pawn.color, true);
    this.board.setPiece(pos, newPiece);
  }

  private getDisambiguationInfo(
    fromPos: Position,
    toPos: Position,
    piece: Piece
  ): { needsFile?: boolean; needsRank?: boolean } {
    if (piece instanceof Pawn || piece instanceof King) {
      return {};
    }

    // find all pieces of the same type and color that can move to the same square
    const sameTypePieces = this.board
      .getAllPieces(piece.color)
      .filter(([pos, p]) => {
        if (p.pieceType !== piece.pieceType) return false;
        if (pos.row === fromPos.row && pos.col === fromPos.col) return false;

        const legalMoves = this.getLegalMoves(pos);
        return legalMoves.some(
          (m) => m.row === toPos.row && m.col === toPos.col
        );
      });

    if (sameTypePieces.length === 0) {
      return {};
    }

    // check if file disambiguation is enough
    const sameFile = sameTypePieces.some(([pos]) => pos.col === fromPos.col);
    const sameRank = sameTypePieces.some(([pos]) => pos.row === fromPos.row);

    if (!sameFile) {
      return { needsFile: true };
    } else if (!sameRank) {
      return { needsRank: true };
    } else {
      return { needsFile: true, needsRank: true };
    }
  }

  updateGameStatus() {
    let hasLegalMoves = false;
    for (const [pos] of this.board.getAllPieces(this.currentTurn)) {
      if (this.getLegalMoves(pos).length > 0) {
        hasLegalMoves = true;
        break;
      }
    }

    if (!hasLegalMoves) {
      this.status = this.board.isInCheck(this.currentTurn)
        ? "checkmate"
        : "stalemate";
    } else {
      this.status = "active";
    }
  }

  resetGame() {
    this.board = new Board(this.initialFEN);
    this.currentTurn = "white";
    this.moveHistory = [];
    this.status = "active";
    this.gameHistory = [
      {
        status: this.status,
        board: this.board.clone(),
      },
    ];
    this.currentHistoryIndex = 0;
  }

  isCheckmate(): boolean {
    return this.status === "checkmate";
  }

  isStalemate(): boolean {
    return this.status === "stalemate";
  }

  isCheck(): boolean {
    return this.board.isInCheck(this.currentTurn);
  }

  getMoveList(): string[] {
    return this.moveHistory.map((move) => move.toSAN());
  }

  serializeHistory(): HistoryData[] {
    return this.gameHistory.map((h) => ({
      status: h.status,
      board: h.board.serializeBoard(),
    }));
  }

  display(): string {
    const lines = [this.board.display()];
    lines.push(`\nCurrent turn: ${this.currentTurn}`);
    lines.push(`Status: ${this.status}`);
    if (this.isCheck()) lines.push("CHECK!");
    lines.push(`Move: ${this.currentHistoryIndex}/${this.getTotalMoves()}`);
    return lines.join("\n");
  }
}
