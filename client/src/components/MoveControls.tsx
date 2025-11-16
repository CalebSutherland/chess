import type { Color, GameStatus } from "../types/chess_types";

interface MoveControlsProps {
  gameStatus: GameStatus;
  currentTurn: Color;
  canRedo: boolean;
  canUndo: boolean;
  currentMoveIndex: number;
  totalMoves: number;
  handleUndo: () => void;
  handleRedo: () => void;
  handleJumpToStart: () => void;
  handleJumpToEnd: () => void;
}
export default function MoveControls({
  gameStatus,
  currentTurn,
  canRedo,
  canUndo,
  currentMoveIndex,
  totalMoves,
  handleUndo,
  handleRedo,
  handleJumpToStart,
  handleJumpToEnd,
}: MoveControlsProps) {
  return (
    <div>
      <p>status: {gameStatus}</p>
      <p>current: {currentTurn}</p>

      <div className="controls">
        <button
          onClick={handleJumpToStart}
          disabled={!canUndo}
          title="Jump to start"
        >
          {"<<"} Start
        </button>
        <button onClick={handleUndo} disabled={!canUndo}>
          Undo {"<-"}
        </button>
        <button onClick={handleRedo} disabled={!canRedo}>
          Redo {"->"}
        </button>
        <button
          onClick={handleJumpToEnd}
          disabled={!canRedo}
          title="Jump to end"
        >
          {">>"} End
        </button>
        <span style={{ marginLeft: "10px", color: "#666" }}>
          Move {currentMoveIndex} / {totalMoves}
        </span>
      </div>
    </div>
  );
}
