import { Game } from "./game";
import { GameSerializer } from "./gameSerializer";
import { Position } from "./position";
import type { GameStateDTO, MoveResponseDTO } from "./types";
import type { PieceType } from "../types/chess_types";

export class GameStateManager {
  private game: Game;
  private stateVersion: number = 0;

  constructor(game: Game) {
    this.game = game;
  }

  getGame(): Game {
    return this.game;
  }

  getState(): GameStateDTO {
    return GameSerializer.serializeGame(this.game);
  }

  applyRemoteState(dto: GameStateDTO): void {
    this.game = GameSerializer.deserializeGame(dto);
    this.stateVersion++;
  }

  makeMove(
    from: Position,
    to: Position,
    promotion?: PieceType
  ): MoveResponseDTO {
    const success = this.game.makeMove(from, to, promotion);

    if (success) {
      this.stateVersion++;
      return {
        success: true,
        gameState: this.getState(),
      };
    }

    return {
      success: false,
      error: "Illegal move",
    };
  }

  getLegalMoves(position: Position): Array<{ row: number; col: number }> {
    return this.game.getLegalMoves(position).map((pos) => ({
      row: pos.row,
      col: pos.col,
    }));
  }

  getStateVersion(): number {
    return this.stateVersion;
  }
}
