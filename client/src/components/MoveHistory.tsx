import "./MoveHistory.css";

interface MoveHistoryProps {
  moves: string[];
  historyIndex: number;
  onMoveClick: (index: number) => void;
}
export default function MoveHistory({
  moves,
  historyIndex,
  onMoveClick,
}: MoveHistoryProps) {
  const movePairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      moveNumber: i / 2 + 1,
      white: moves[i],
      black: moves[i + 1] ?? null,
    });
  }

  return (
    <div>
      <div className="move-list">
        {movePairs.map((pair, pairIndex) => {
          const whiteMoveIndex = pairIndex * 2 + 1;
          const blackMoveIndex = pairIndex * 2 + 2;

          return (
            <div key={pair.moveNumber} className="move-pair">
              <span className="move-number">{pair.moveNumber}.</span>

              {/* White move */}
              <button
                className={`move-button ${
                  historyIndex === whiteMoveIndex ? "active" : ""
                }`}
                onClick={() => onMoveClick(whiteMoveIndex)}
              >
                {pair.white}
              </button>

              {/* Black move (if exists) */}
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
