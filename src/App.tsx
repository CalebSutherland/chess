import { useState } from "react";
import "./App.css";

type PieceType = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";
type Color = "white" | "black";

interface Piece {
  type: PieceType;
  color: Color;
}

type Board = (Piece | null)[][];
type Position = [number, number];

interface BoardSquareProps {
  color: string;
  piece: Piece | null;
  handleClick: () => void;
}
function BoardSquare({ color, piece, handleClick }: BoardSquareProps) {
  return (
    <div
      className="square"
      style={{ backgroundColor: color }}
      onClick={handleClick}
    >
      {piece && (
        <p>
          {piece.color} {piece.type}
        </p>
      )}
    </div>
  );
}

interface BoardDisplayProps {
  board: Board;
  selected: Position | null;
  setSelected: React.Dispatch<React.SetStateAction<Position | null>>;
}
function BoardDisplay({ board, selected, setSelected }: BoardDisplayProps) {
  const handleClick = (position: Position) => {
    setSelected([position[0], position[1]]);
  };
  return (
    <div className="board">
      {board.map((row, r) => (
        <div key={r} className="row">
          {row.map((_, c) => {
            const isSelected = selected?.[0] === r && selected?.[1] === c;
            const color = isSelected
              ? "green"
              : (r + c) % 2 === 0
              ? "white"
              : "black";

            return (
              <BoardSquare
                key={`${r}-${c}`}
                piece={board[r][c]}
                color={color}
                handleClick={() => handleClick([r, c])}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function App() {
  // const initialBoard: Board = [
  //   [
  //     { type: "rook", color: "black" },
  //     { type: "knight", color: "black" },
  //     { type: "bishop", color: "black" },
  //     { type: "queen", color: "black" },
  //     { type: "king", color: "black" },
  //     { type: "bishop", color: "black" },
  //     { type: "knight", color: "black" },
  //     { type: "rook", color: "black" },
  //   ],
  //   Array(8)
  //     .fill(null)
  //     .map(() => ({ type: "pawn", color: "black" })),
  //   Array(8).fill(null),
  //   Array(8).fill(null),
  //   Array(8).fill(null),
  //   Array(8).fill(null),
  //   Array(8)
  //     .fill(null)
  //     .map(() => ({ type: "pawn", color: "white" })),
  //   [
  //     { type: "rook", color: "white" },
  //     { type: "knight", color: "white" },
  //     { type: "bishop", color: "white" },
  //     { type: "queen", color: "white" },
  //     { type: "king", color: "white" },
  //     { type: "bishop", color: "white" },
  //     { type: "knight", color: "white" },
  //     { type: "rook", color: "white" },
  //   ],
  // ];

  const [board, setBoard] = useState<Board>(
    Array.from({ length: 8 }, () => Array(8).fill(null))
  );
  // const [board, setBoard] = useState<Board>(initialBoard);
  const [selected, setSelected] = useState<Position | null>(null);
  return (
    <div>
      <BoardDisplay
        board={board}
        selected={selected}
        setSelected={setSelected}
      />
    </div>
  );
}

export default App;
