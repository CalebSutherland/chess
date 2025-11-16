import type {
  Color,
  GameStatus,
  PieceType,
  PositionData,
} from "../types/chess_types";
import { Board } from "./board";
import { Move } from "./move";
import { MoveValidator } from "./moveValidator";
import { Piece, King, Pawn } from "./piece";
import { Position } from "./position";
import { SpecialMoveHandler } from "./specialMoveHandler";
import type { GameHistory } from "./types";

export class Game {
  private initialFEN: string;
  private board: Board;
  private currentTurn: Color;
  private moveHistory: Move[];
  private status: GameStatus;
  private gameHistory: GameHistory[];
  private currentHistoryIndex: number;
  private viewOnlyMode: boolean;

  // New: Move validator extracted
  private moveValidator: MoveValidator;

  constructor(
    fen: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
    viewOnlyMode: boolean = false
  ) {
    this.initialFEN = fen;
    this.board = new Board(fen);
    this.currentTurn = "white";
    this.moveHistory = [];
    this.status = "active";
    this.gameHistory = [{ status: this.status, board: this.board.clone() }];
    this.currentHistoryIndex = 0;
    this.viewOnlyMode = viewOnlyMode;
    this.moveValidator = new MoveValidator(this);
  }

  // Public getters for serialization
  get Board() {
    return this.board;
  }
  get CurrentTurn() {
    return this.currentTurn;
  }
  get Status() {
    return this.status;
  }
  get MoveHistory() {
    return this.moveHistory;
  }
  get InitialFEN() {
    return this.initialFEN;
  }
  get CurrentHistoryIndex() {
    return this.currentHistoryIndex;
  }

  get LastMove(): Move | undefined {
    if (this.currentHistoryIndex === 0) return undefined;
    return this.moveHistory[this.currentHistoryIndex - 1];
  }

  private getOpponentColor(): Color {
    return this.currentTurn === "white" ? "black" : "white";
  }

  canMakeMove(): boolean {
    if (!this.viewOnlyMode) return true;
    return this.isAtCurrentPosition();
  }

  getLegalMoves(position: Position): Position[] {
    return this.moveValidator.getLegalMoves(position);
  }

  makeMove(
    fromPos: Position,
    toPos: Position,
    promotionPiece?: PieceType
  ): boolean {
    if (!this.canMakeMove()) return false;

    const piece = this.board.getPiece(fromPos);
    if (!piece || piece.color !== this.currentTurn) return false;

    const legalMoves = this.getLegalMoves(fromPos);
    if (!legalMoves.some((p) => p.row === toPos.row && p.col === toPos.col))
      return false;

    // Truncate history if not at end
    this.truncateHistoryIfNeeded();

    const move = this.createMove(fromPos, toPos, piece, promotionPiece);
    this.executeMove(move, piece);
    this.recordMove(move);
    this.switchTurns();
    this.updateGameStatus();
    this.annotateMove(move);

    return true;
  }

  private truncateHistoryIfNeeded(): void {
    if (this.currentHistoryIndex < this.gameHistory.length - 1) {
      this.gameHistory = this.gameHistory.slice(
        0,
        this.currentHistoryIndex + 1
      );
      this.moveHistory = this.moveHistory.slice(0, this.currentHistoryIndex);
    }
  }

  private createMove(
    fromPos: Position,
    toPos: Position,
    piece: Piece,
    promotionPiece?: PieceType
  ): Move {
    const move = new Move(fromPos, toPos, promotionPiece);
    move.movingPiece = this.clonePiece(piece);
    move.disambiguationInfo = this.moveValidator.getDisambiguationInfo(
      fromPos,
      toPos,
      piece
    );
    return move;
  }

  private clonePiece(piece: Piece): Piece {
    return Object.assign(Object.create(Object.getPrototypeOf(piece)), piece);
  }

  private executeMove(move: Move, piece: Piece): void {
    if (
      piece instanceof King &&
      Math.abs(move.toPos.col - move.fromPos.col) === 2
    ) {
      SpecialMoveHandler.performCastling(this.board, move.fromPos, move.toPos);
      move.isCastling = true;
    } else if (
      piece instanceof Pawn &&
      Math.abs(move.toPos.col - move.fromPos.col) === 1 &&
      !this.board.getPiece(move.toPos)
    ) {
      SpecialMoveHandler.performEnPassant(this.board, move.fromPos, move.toPos);
      move.isEnPassant = true;
    } else {
      move.capturedPiece = this.board.movePiece(move.fromPos, move.toPos);
    }

    if (piece instanceof Pawn) {
      SpecialMoveHandler.promotePawnIfNeeded(
        this.board,
        move.toPos,
        piece,
        move.promotionPiece
      );
    }
  }

  private recordMove(move: Move): void {
    this.moveHistory.push(move);
    this.gameHistory.push({ status: this.status, board: this.board.clone() });
    this.currentHistoryIndex = this.gameHistory.length - 1;
  }

  private switchTurns(): void {
    this.currentTurn = this.getOpponentColor();
  }

  private annotateMove(move: Move): void {
    move.isCheck = this.board.isInCheck(this.currentTurn);
    move.isCheckmate = this.status === "checkmate";
  }

  private updateGameStatus(): void {
    const hasLegalMoves = this.board
      .getAllPieces(this.currentTurn)
      .some(([pos]) => this.getLegalMoves(pos).length > 0);

    if (!hasLegalMoves) {
      this.status = this.board.isInCheck(this.currentTurn)
        ? "checkmate"
        : "stalemate";
    } else {
      this.status = "active";
    }
  }

  // History navigation methods
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
    return (
      this.currentHistoryIndex > 0 &&
      this.jumpToMove(this.currentHistoryIndex - 1)
    );
  }

  redo(): boolean {
    return (
      this.currentHistoryIndex < this.gameHistory.length - 1 &&
      this.jumpToMove(this.currentHistoryIndex + 1)
    );
  }

  isAtCurrentPosition(): boolean {
    return this.currentHistoryIndex === this.gameHistory.length - 1;
  }

  getTotalMoves(): number {
    return this.gameHistory.length - 1;
  }

  getCurrentMoveNumber(): number {
    return this.currentHistoryIndex;
  }

  getCurrentMove(): Move | null {
    if (this.currentHistoryIndex === 0) return null;
    return this.moveHistory[this.currentHistoryIndex - 1];
  }

  getMoveList(): string[] {
    return this.moveHistory.map((move) => move.toSAN());
  }

  canUndo(): boolean {
    return this.currentHistoryIndex > 0;
  }

  canRedo(): boolean {
    return this.currentHistoryIndex < this.gameHistory.length - 1;
  }

  isCheck(): boolean {
    return this.board.isInCheck(this.currentTurn);
  }

  serializeLegalMoves(position: Position): PositionData[] {
    const legalMoves = this.getLegalMoves(position);
    return legalMoves.map((pos) => pos.serializePosition());
  }

  resetGame(): void {
    this.board = new Board(this.initialFEN);
    this.currentTurn = "white";
    this.moveHistory = [];
    this.status = "active";
    this.gameHistory = [{ status: this.status, board: this.board.clone() }];
    this.currentHistoryIndex = 0;
  }
}
