import { pieceIcons } from "../assets/pieces/";
import { findKingPos } from "../game/game_logic";
import BoardSquare from "./BoardSquare";

import type { Board, Color, Position } from "../types/chess_types";

interface BoardDisplayProps {
  board: Board;
  selected: Position | null;
  validMoves: Position[] | null;
  lastMove: [Position, Position] | null;
  currentTurn: Color;
  inCheck: Color | null;
  handleSquareClick: (position: Position) => void;
}
export default function BoardDisplay({
  board,
  selected,
  validMoves,
  lastMove,
  currentTurn,
  inCheck,
  handleSquareClick,
}: BoardDisplayProps) {
  let kingPos: Position | null = null;
  if (inCheck) {
    kingPos = findKingPos(currentTurn, board);
  }
  return (
    <div className="board">
      {board.map((row, r) =>
        row.map((_, c) => {
          const isSelected = selected?.[0] === r && selected?.[1] === c;
          const color = isSelected
            ? "yellow"
            : (r + c) % 2 === 0
            ? "#edce8a"
            : "#720a0a";
          const isHighlight = validMoves?.some(
            (move) => move[0] === r && move[1] === c
          );
          const isLastMove = lastMove?.some(
            (move) => move[0] === r && move[1] === c
          );
          const kingInCheck = kingPos
            ? kingPos[0] === r && kingPos[1] === c
            : false;
          const piece = board[r][c];
          const pieceIcon = piece ? pieceIcons[piece.type][piece.color] : null;

          return (
            <BoardSquare
              key={`${r}-${c}`}
              piece={pieceIcon}
              color={color}
              highlight={isHighlight}
              lastMove={isLastMove}
              inCheck={kingInCheck}
              handleSquareClick={() => handleSquareClick([r, c])}
            />
          );
        })
      )}
    </div>
  );
}
