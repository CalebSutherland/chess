interface BoardSquareProps {
  color: string;
  piece: string | null;
  highlight?: boolean;
  lastMove?: boolean;
  inCheck?: boolean;
  handleSquareClick: () => void;
}
export default function BoardSquare({
  color,
  piece,
  highlight,
  lastMove,
  inCheck,
  handleSquareClick,
}: BoardSquareProps) {
  return (
    <div
      className={`square ${lastMove ? "last_move" : ""} ${
        inCheck ? "check" : ""
      }`}
      style={{ backgroundColor: color }}
      onClick={handleSquareClick}
    >
      {piece && <img src={piece} alt="chess piece" className="piece" />}
      {highlight && <div className="highlight-dot"></div>}
    </div>
  );
}
