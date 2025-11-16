import type { Color, PieceData, PieceType } from "../types/chess_types";
import { Position } from "./position";
import { Board } from "./board";

export abstract class Piece {
  readonly color: Color;
  abstract pieceType: PieceType;
  hasMoved: boolean;

  constructor(color: Color, hasMoved = false) {
    this.color = color;
    this.hasMoved = hasMoved;
  }

  abstract symbol(): string;
  abstract getPossibleMoves(pos: Position, board: Board): Position[];

  // helper for bishop/rook/queen
  protected slide(
    pos: Position,
    board: Board,
    directions: Array<[number, number]>
  ): Position[] {
    const moves: Position[] = [];

    for (const [dr, dc] of directions) {
      let r = pos.row;
      let c = pos.col;

      while (true) {
        r += dr;
        c += dc;
        if (r < 0 || r >= 8 || c < 0 || c >= 8) break;

        const newPos = new Position(r, c);
        const piece = board.getPiece(newPos);

        if (!piece) {
          moves.push(newPos);
        } else {
          if (piece.color !== this.color) moves.push(newPos);
          break;
        }
      }
    }

    return moves;
  }

  serializePiece(): PieceData {
    return {
      type: this.pieceType,
      color: this.color,
      hasMoved: this.hasMoved,
    };
  }
}

export class King extends Piece {
  pieceType: PieceType = "king";

  symbol(): string {
    return this.color === "white" ? "K" : "k";
  }

  getPossibleMoves(pos: Position, board: Board): Position[] {
    const directions: Array<[number, number]> = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    const moves: Position[] = [];

    for (const [dr, dc] of directions) {
      const r = pos.row + dr;
      const c = pos.col + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const newPos = new Position(r, c);
        const piece = board.getPiece(newPos);
        if (!piece || piece.color !== this.color) moves.push(newPos);
      }
    }

    return moves;
  }
}

export class Queen extends Piece {
  pieceType: PieceType = "queen";

  symbol(): string {
    return this.color === "white" ? "Q" : "q";
  }

  getPossibleMoves(pos: Position, board: Board): Position[] {
    const directions: Array<[number, number]> = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];

    return this.slide(pos, board, directions);
  }
}

export class Rook extends Piece {
  pieceType: PieceType = "rook";

  symbol(): string {
    return this.color === "white" ? "R" : "r";
  }

  getPossibleMoves(pos: Position, board: Board): Position[] {
    const directions: Array<[number, number]> = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    return this.slide(pos, board, directions);
  }
}

export class Bishop extends Piece {
  pieceType: PieceType = "bishop";

  symbol(): string {
    return this.color === "white" ? "B" : "b";
  }

  getPossibleMoves(pos: Position, board: Board): Position[] {
    const directions: Array<[number, number]> = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];

    return this.slide(pos, board, directions);
  }
}

export class Knight extends Piece {
  pieceType: PieceType = "knight";

  symbol(): string {
    return this.color === "white" ? "N" : "n";
  }

  getPossibleMoves(pos: Position, board: Board): Position[] {
    const moves: Position[] = [];
    const offsets: Array<[number, number]> = [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1],
    ];

    for (const [dr, dc] of offsets) {
      const r = pos.row + dr;
      const c = pos.col + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const newPos = new Position(r, c);
        const piece = board.getPiece(newPos);
        if (!piece || piece.color !== this.color) moves.push(newPos);
      }
    }

    return moves;
  }
}

export class Pawn extends Piece {
  pieceType: PieceType = "pawn";

  symbol(): string {
    return this.color === "white" ? "P" : "p";
  }

  getPossibleMoves(pos: Position, board: Board): Position[] {
    const moves: Position[] = [];
    const direction = this.color === "white" ? -1 : 1;

    // 1 square forward
    const one = new Position(pos.row + direction, pos.col);
    if (one.isValid() && !board.getPiece(one)) {
      moves.push(one);

      // 2 squares forward if not moved
      if (!this.hasMoved) {
        const two = new Position(pos.row + direction * 2, pos.col);
        if (two.isValid() && !board.getPiece(two)) moves.push(two);
      }
    }

    // diagonal captures
    for (const dc of [-1, 1]) {
      const diag = new Position(pos.row + direction, pos.col + dc);
      if (diag.isValid()) {
        const piece = board.getPiece(diag);
        if (piece && piece.color !== this.color) moves.push(diag);
      }
    }

    return moves;
  }

  // for checking if a square is under attack
  getAttackPositions(pos: Position): Position[] {
    const attacks: Position[] = [];
    const direction = this.color === "white" ? -1 : 1;

    for (const dc of [-1, 1]) {
      const diag = new Position(pos.row + direction, pos.col + dc);
      if (diag.isValid()) attacks.push(diag);
    }

    return attacks;
  }
}
