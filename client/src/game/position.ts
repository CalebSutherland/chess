import type { PositionData } from "../types/chess_types";

export class Position {
  row: number;
  col: number;

  constructor(row: number, col: number) {
    this.row = row;
    this.col = col;
  }

  isValid(): boolean {
    return this.row >= 0 && this.row < 8 && this.col >= 0 && this.col < 8;
  }

  toAlgebraic(): string {
    const file = String.fromCharCode("a".charCodeAt(0) + this.col);
    const rank = String(8 - this.row);
    return `${file}${rank}`;
  }

  static fromAlgebraic(algebraic: string): Position {
    if (algebraic.length !== 2) {
      throw new Error(`Invalid algebraic notation: ${algebraic}`);
    }

    const file = algebraic[0].toLowerCase();
    const rank = algebraic[1];

    const col = file.charCodeAt(0) - "a".charCodeAt(0);
    const row = 8 - Number(rank);

    return new Position(row, col);
  }

  offset(rowDelta: number, colDelta: number): Position {
    return new Position(this.row + rowDelta, this.col + colDelta);
  }

  toString(): string {
    return this.toAlgebraic();
  }

  serializePosition(): PositionData {
    return { row: this.row, col: this.col };
  }

  repr(): string {
    return `Position(${this.row}, ${this.col})`;
  }
}
