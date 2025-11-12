import { findKingPos } from "../game/game_logic";
import type { Board, Color, PieceType, Position } from "../types/chess_types";
import BoardSquare from "./BoardSquare";

import whitePawn from "../assets/pieces/white/pawn.svg";
import whiteBishop from "../assets/pieces/white/bishop.svg";
import whiteKnight from "../assets/pieces/white/knight.svg";
import whiteRook from "../assets/pieces/white/rook.svg";
import whiteQueen from "../assets/pieces/white/queen.svg";
import whiteKing from "../assets/pieces/white/king.svg";
import blackPawn from "../assets/pieces/black/pawn.svg";
import blackBishop from "../assets/pieces/black/bishop.svg";
import blackKnight from "../assets/pieces/black/knight.svg";
import blackRook from "../assets/pieces/black/rook.svg";
import blackQueen from "../assets/pieces/black/queen.svg";
import blackKing from "../assets/pieces/black/king.svg";

const pieceIcons: Record<PieceType, Record<Color, string>> = {
  king: { white: whiteKing, black: blackKing },
  queen: { white: whiteQueen, black: blackQueen },
  rook: { white: whiteRook, black: blackRook },
  bishop: { white: whiteBishop, black: blackBishop },
  knight: { white: whiteKnight, black: blackKnight },
  pawn: { white: whitePawn, black: blackPawn },
};

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
