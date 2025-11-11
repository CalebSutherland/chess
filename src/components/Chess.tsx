import { useEffect, useState } from "react";
import type {
  Board,
  Color,
  Piece,
  PieceType,
  Position,
} from "../types/chess_types";
import { findKingPos, generateMoves, isInCheck } from "../game/game_logic";
import "./Chess.css";

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

const initialBoard: Board = [
  [
    { type: "rook", color: "black" },
    { type: "knight", color: "black" },
    { type: "bishop", color: "black" },
    { type: "queen", color: "black" },
    { type: "king", color: "black" },
    { type: "bishop", color: "black" },
    { type: "knight", color: "black" },
    { type: "rook", color: "black" },
  ],
  Array(8)
    .fill(null)
    .map(() => ({ type: "pawn", color: "black" })),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8)
    .fill(null)
    .map(() => ({ type: "pawn", color: "white" })),
  [
    { type: "rook", color: "white" },
    { type: "knight", color: "white" },
    { type: "bishop", color: "white" },
    { type: "queen", color: "white" },
    { type: "king", color: "white" },
    { type: "bishop", color: "white" },
    { type: "knight", color: "white" },
    { type: "rook", color: "white" },
  ],
];

interface BoardSquareProps {
  color: string;
  piece: string | null;
  highlight?: boolean;
  lastMove?: boolean;
  inCheck?: boolean;
  handleSquareClick: () => void;
}
function BoardSquare({
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

interface BoardDisplayProps {
  board: Board;
  selected: Position | null;
  validMoves: Position[] | null;
  lastMove: [Position, Position] | null;
  currentTurn: Color;
  inCheck: Color | null;
  handleSquareClick: (position: Position) => void;
}
function BoardDisplay({
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

export default function Chess() {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [selected, setSelected] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[] | null>(null);
  const [lastMove, setLastMove] = useState<[Position, Position] | null>(null);
  const [currentTurn, setCurrentTurn] = useState<Color>("white");
  const [inCheck, setInCheck] = useState<Color | null>(null);

  const handleSquareClick = (position: Position) => {
    const row = position[0];
    const col = position[1];

    // if piece selected and valid move
    if (
      selected &&
      validMoves?.some((move) => move[0] === row && move[1] === col)
    ) {
      const newBoard = board.map((row) => [...row]);
      newBoard[row][col] = board[selected[0]][selected[1]];
      newBoard[selected[0]][selected[1]] = null;

      if (!isInCheck(currentTurn, newBoard)) {
        setBoard(newBoard);
        const nextTurn = currentTurn === "white" ? "black" : "white";

        if (isInCheck(nextTurn, newBoard)) {
          setInCheck(nextTurn);
        } else {
          setInCheck(null);
        }

        setCurrentTurn(nextTurn);
      }

      setSelected(null);
      setValidMoves(null);
      setLastMove([
        [row, col],
        [selected[0], selected[1]],
      ]);
      return;
    }
    // if theres a correct color peice at this position
    else if (board[row][col] && board[row][col].color === currentTurn) {
      setSelected(position);
      const moves = generateMoves(row, col, board[row][col], board);
      // find moves that dont put king in check
      const legalMoves = moves.filter(([mr, mc]) => {
        const testBoard = board.map((r) => [...r]);
        testBoard[mr][mc] = testBoard[row][col];
        testBoard[row][col] = null;
        return !isInCheck(currentTurn, testBoard);
      });
      setValidMoves(legalMoves);
    } else {
      setSelected(null);
      setValidMoves(null);
    }
  };

  return (
    <div className="chess">
      <p>Turn: {currentTurn}</p>
      <p>Check: {inCheck}</p>
      <BoardDisplay
        board={board}
        selected={selected}
        validMoves={validMoves}
        lastMove={lastMove}
        currentTurn={currentTurn}
        inCheck={inCheck}
        handleSquareClick={handleSquareClick}
      />
    </div>
  );
}
