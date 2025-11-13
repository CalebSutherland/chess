import { getMovePairs } from "../game/san";
import type { GameState } from "../types/chess_types";
import "./History.css";

interface MoveHistoryProps {
  history: GameState[];
  historyIndex: number;
  onMoveClick: (index: number) => void;
}

export default function History({
  history,
  historyIndex,
  onMoveClick,
}: MoveHistoryProps) {
  const movePairs = getMovePairs(history);

  return (
    <div>
      <div className="move-list">
        {movePairs.map((pair, pairIndex) => {
          const whiteMoveIndex = pairIndex * 2 + 1;
          const blackMoveIndex = pairIndex * 2 + 2;

          return (
            <div key={pair.moveNumber} className="move-pair">
              <span className="move-number">{pair.moveNumber}.</span>

              <button
                className={`move-button ${
                  historyIndex === whiteMoveIndex ? "active" : ""
                }`}
                onClick={() => onMoveClick(whiteMoveIndex)}
              >
                {pair.white}
              </button>

              {pair.black && (
                <button
                  className={`move-button ${
                    historyIndex === blackMoveIndex ? "active" : ""
                  }`}
                  onClick={() => onMoveClick(blackMoveIndex)}
                >
                  {pair.black}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
