import { useEffect, useState } from "react";
import type { Board, Piece, Position } from "../types/chess_types";
import { generate_moves } from "../game/game_logic";
import "./Chess.css";

interface BoardSquareProps {
  color: string;
  piece: Piece | null;
  isSelected: boolean;
  highlight?: boolean;
  handleSquareClick: () => void;
}
function BoardSquare({
  color,
  piece,
  isSelected,
  highlight,
  handleSquareClick,
}: BoardSquareProps) {
  let border = "";
  if (isSelected) {
    border = "4px solid blue";
  } else if (highlight) {
    border = "4px solid red";
  }
  return (
    <div
      className="square"
      style={{ backgroundColor: color, border: border }}
      onClick={handleSquareClick}
    >
      {piece && <p>P</p>}
    </div>
  );
}

interface BoardDisplayProps {
  board: Board;
  selected: Position | null;
  validMoves: Position[] | null;
  handleSquareClick: (position: Position) => void;
}
function BoardDisplay({
  board,
  selected,
  validMoves,
  handleSquareClick,
}: BoardDisplayProps) {
  return (
    <div className="board">
      {board.map((row, r) =>
        row.map((_, c) => {
          const isSelected = selected?.[0] === r && selected?.[1] === c;
          const color = (r + c) % 2 === 0 ? "#edce8a" : "#350901";

          const highlight = validMoves?.some(
            (move) => move[0] === r && move[1] === c
          );

          return (
            <BoardSquare
              key={`${r}-${c}`}
              piece={board[r][c]}
              color={color}
              isSelected={isSelected}
              highlight={highlight}
              handleSquareClick={() => handleSquareClick([r, c])}
            />
          );
        })
      )}
    </div>
  );
}
export default function Chess() {
  const [board, setBoard] = useState<Board>(
    Array.from({ length: 8 }, () => Array(8).fill(null))
  );
  const [selected, setSelected] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[] | null>(null);

  const handleSquareClick = (position: Position) => {
    const row = position[0];
    const col = position[1];

    if (selected && board[selected[0]][selected[1]]) {
      const valid = validMoves?.some(
        (move) => move[0] === row && move[1] === col
      );
      if (valid) {
        setBoard((prev) => {
          const newBoard = prev.map((row) => [...row]);
          newBoard[row][col] = prev[selected[0]][selected[1]];
          newBoard[selected[0]][selected[1]] = null;
          return newBoard;
        });
        setSelected(null);
        setValidMoves(null);
        return;
      }
    }
    setSelected(position);
    if (board[row][col]) {
      const moves = generate_moves(row, col, board[row][col], board);
      setValidMoves(moves);
    } else {
      setValidMoves(null);
    }
  };

  useEffect(() => {
    setBoard((prev) => {
      const newBoard = prev.map((row) => [...row]);
      newBoard[6][6] = { type: "pawn", color: "white" };
      newBoard[1][7] = { type: "pawn", color: "black" };
      return newBoard;
    });
  }, []);

  useEffect(() => {
    console.log(validMoves);
  }, [validMoves]);

  //   const moves = generate_moves(6, 6, { type: "pawn", color: "white" }, board);
  //   console.log(moves);

  return (
    <div>
      <BoardDisplay
        board={board}
        selected={selected}
        validMoves={validMoves}
        handleSquareClick={handleSquareClick}
      />
    </div>
  );
}
