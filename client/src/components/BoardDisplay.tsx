import BoardSquare from "./BoardSquare";
import { pieceIcons } from "../assets/pieces";

import type { MoveData, PositionData, BoardData } from "../types/chess_types";

interface BoardDisplayProps {
  board: BoardData;
  selected: PositionData | null;
  validMoves: PositionData[] | null;
  lastMove: MoveData | null;
  inCheck: PositionData | null;
  handleSquareClick: (position: PositionData) => void;
}
export default function BoardDisplay({
  board,
  selected,
  validMoves,
  lastMove,
  inCheck,
  handleSquareClick,
}: BoardDisplayProps) {
  return (
    <div className="board">
      {board.map((row, r) =>
        row.map((_, c) => {
          const isSelected = selected?.row === r && selected?.col === c;
          const color = isSelected
            ? "yellow"
            : (r + c) % 2 === 0
            ? "#edce8a"
            : "#720a0a";
          const isHighlight = validMoves?.some(
            (move) => move.row === r && move.col === c
          );
          let isLastMove = false;
          if (
            lastMove &&
            ((lastMove.from_pos.row === r && lastMove.from_pos.col === c) ||
              (lastMove.to_pos.row === r && lastMove.to_pos.col === c))
          ) {
            isLastMove = true;
          }
          const isInCheck =
            inCheck && inCheck.col === c && inCheck.row == r ? true : false;
          const piece = board[r][c];
          const pieceIcon = piece ? pieceIcons[piece.type][piece.color] : null;

          return (
            <BoardSquare
              key={`${r}-${c}`}
              piece={pieceIcon}
              color={color}
              highlight={isHighlight}
              lastMove={isLastMove}
              inCheck={isInCheck}
              handleSquareClick={() => handleSquareClick({ row: r, col: c })}
            />
          );
        })
      )}
    </div>
  );
}
