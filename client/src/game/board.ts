import { Position } from "./position";
import { Piece, King, Queen, Rook, Bishop, Knight, Pawn } from "./piece";
import type { BoardData, Color } from "../types/chess_types";
import type { BoardGrid } from "./types";

export class Board {
  grid: BoardGrid;

  constructor(fen?: string) {
    if (fen) {
      this.grid = this.createBoardFromFEN(fen);
    } else {
      this.grid = Array.from({ length: 8 }, () => Array(8).fill(null));
    }
  }

  getPiece(pos: Position): Piece | null {
    return this.grid[pos.row][pos.col];
  }

  setPiece(pos: Position, piece: Piece | null): void {
    this.grid[pos.row][pos.col] = piece;
  }

  movePiece(from: Position, to: Position): Piece | null {
    const piece = this.getPiece(from);
    const captured = this.getPiece(to);

    this.grid[to.row][to.col] = piece;
    this.grid[from.row][from.col] = null;

    if (piece) piece.hasMoved = true;
    return captured;
  }

  clone(): Board {
    const newBoard = new Board();
    newBoard.grid = this.grid.map((row) =>
      row.map((piece) =>
        piece
          ? Object.assign(Object.create(Object.getPrototypeOf(piece)), piece)
          : null
      )
    );
    return newBoard;
  }

  getAllPieces(color: Color): Array<[Position, Piece]> {
    const pieces: Array<[Position, Piece]> = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.grid[r][c];
        if (piece && piece.color === color) {
          pieces.push([new Position(r, c), piece]);
        }
      }
    }
    return pieces;
  }

  isSquareUnderAttack(pos: Position, attackerColor: Color): boolean {
    for (const [piecePos, piece] of this.getAllPieces(attackerColor)) {
      const attacks =
        piece instanceof Pawn
          ? piece.getAttackPositions(piecePos)
          : piece.getPossibleMoves(piecePos, this);

      if (attacks.some((p) => p.row === pos.row && p.col === pos.col)) {
        return true;
      }
    }
    return false;
  }

  findKing(color: Color): Position {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.grid[r][c];
        if (piece && piece.color === color && piece instanceof King) {
          return new Position(r, c);
        }
      }
    }
    return new Position(-1, -1);
  }

  isInCheck(color: Color): boolean {
    const kingPos = this.findKing(color);
    if (!kingPos) return false;

    const opponentColor: Color = color === "white" ? "black" : "white";
    return this.isSquareUnderAttack(kingPos, opponentColor);
  }

  private checkStartingSquare(piece: Piece, row: number, col: number): boolean {
    const t = piece.pieceType;
    const c = piece.color;

    if (t === "pawn")
      return (c === "white" && row === 6) || (c === "black" && row === 1);
    if (t === "rook")
      return (
        (c === "white" && row === 7 && [0, 7].includes(col)) ||
        (c === "black" && row === 0 && [0, 7].includes(col))
      );
    if (t === "knight")
      return (
        (c === "white" && row === 7 && [1, 6].includes(col)) ||
        (c === "black" && row === 0 && [1, 6].includes(col))
      );
    if (t === "bishop")
      return (
        (c === "white" && row === 7 && [2, 5].includes(col)) ||
        (c === "black" && row === 0 && [2, 5].includes(col))
      );
    if (t === "queen")
      return (
        (c === "white" && row === 7 && col === 3) ||
        (c === "black" && row === 0 && col === 3)
      );
    if (t === "king")
      return (
        (c === "white" && row === 7 && col === 4) ||
        (c === "black" && row === 0 && col === 4)
      );

    return false;
  }

  private createBoardFromFEN(fen: string): BoardGrid {
    const rows = fen.split("/");
    const board: BoardGrid = Array.from({ length: 8 }, () =>
      Array(8).fill(null)
    );

    const fenToClass: Record<string, new (color: Color) => Piece> = {
      p: Pawn,
      r: Rook,
      n: Knight,
      b: Bishop,
      q: Queen,
      k: King,
      P: Pawn,
      R: Rook,
      N: Knight,
      B: Bishop,
      Q: Queen,
      K: King,
    };

    const fenToColor: Record<string, Color> = {
      p: "black",
      r: "black",
      n: "black",
      b: "black",
      q: "black",
      k: "black",
      P: "white",
      R: "white",
      N: "white",
      B: "white",
      Q: "white",
      K: "white",
    };

    for (let rowIndex = 0; rowIndex < 8; rowIndex++) {
      let col = 0;
      for (const char of rows[rowIndex]) {
        if (/\d/.test(char)) {
          col += parseInt(char);
        } else {
          const PieceClass = fenToClass[char];
          const piece = new PieceClass(fenToColor[char]);
          piece.hasMoved = !this.checkStartingSquare(piece, rowIndex, col);
          board[rowIndex][col] = piece;
          col++;
        }
      }
    }

    return board;
  }

  setupInitialPosition(): void {
    this.grid = this.createBoardFromFEN(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
    );
  }

  serializeBoard(): BoardData {
    return this.grid.map((row) =>
      row.map((piece) => (piece ? piece.serializePiece() : null))
    );
  }

  display(): string {
    return this.grid
      .map((row) =>
        row.map((piece) => (piece ? piece.symbol() : ".")).join(" ")
      )
      .join("\n");
  }
}
