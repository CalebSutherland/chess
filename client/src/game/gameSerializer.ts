import { Board } from "./board";
import { Game } from "./game";
import { Move } from "./move";
import { Position } from "./position";
import type { BoardStateDTO, GameStateDTO, MoveDTO } from "./types";
import type { PieceType } from "../types/chess_types";

export class GameSerializer {
  static serializeGame(game: Game): GameStateDTO {
    return {
      board: this.serializeBoard(game.Board),
      currentTurn: game.CurrentTurn,
      status: game.Status,
      moveHistory: game.MoveHistory.map((m) => this.serializeMove(m)),
      initialFEN: game.InitialFEN,
      currentMoveIndex: game.CurrentHistoryIndex,
    };
  }

  static deserializeGame(dto: GameStateDTO): Game {
    // viewOnlyMode = false to allow making moves during reconstruction
    const game = new Game(dto.initialFEN, false);

    // Replay all moves to reconstruct state
    for (let i = 0; i < dto.moveHistory.length; i++) {
      const moveDto = dto.moveHistory[i];
      const from = new Position(moveDto.from.row, moveDto.from.col);
      const to = new Position(moveDto.to.row, moveDto.to.col);
      game.makeMove(from, to, moveDto.promotion);
    }

    // Jump to correct position in history if viewing past moves
    if (dto.currentMoveIndex !== game.CurrentHistoryIndex) {
      game.jumpToMove(dto.currentMoveIndex);
    }

    return game;
  }

  static serializeBoard(board: Board): BoardStateDTO {
    const pieces: BoardStateDTO["pieces"] = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board.grid[row][col];
        if (piece) {
          pieces.push({
            position: { row, col },
            type: piece.pieceType,
            color: piece.color,
            hasMoved: piece.hasMoved,
          });
        }
      }
    }

    return { pieces };
  }

  static serializeMove(move: Move): MoveDTO {
    return {
      from: { row: move.fromPos.row, col: move.fromPos.col },
      to: { row: move.toPos.row, col: move.toPos.col },
      promotion: move.promotionPiece,
    };
  }

  static deserializeMove(dto: MoveDTO): {
    from: Position;
    to: Position;
    promotion?: PieceType;
  } {
    return {
      from: new Position(dto.from.row, dto.from.col),
      to: new Position(dto.to.row, dto.to.col),
      promotion: dto.promotion,
    };
  }
}
