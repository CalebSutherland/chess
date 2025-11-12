import { useEffect, useState } from "react";
import type { Board, Color, Position } from "../types/chess_types";
import {
  generateMoves,
  isCheckmate,
  isInCheck,
  isStalemate,
} from "../game/game_logic";
import BoardDisplay from "./BoardDisplay";
import "./Chess.css";

import { initialBoard, testBoards } from "../game/boards";

export default function Chess() {
  const debugMode = true;

  const [board, setBoard] = useState<Board>(initialBoard);
  const [selected, setSelected] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[] | null>(null);
  const [lastMove, setLastMove] = useState<[Position, Position] | null>(null);
  const [currentTurn, setCurrentTurn] = useState<Color>("white");
  const [inCheck, setInCheck] = useState<Color | null>(null);
  const [checkMate, setCheckmate] = useState(false);
  const [stalemate, setStalemate] = useState(false);

  useEffect(() => {
    console.log(board);
  }, [board]);

  const handleSquareClick = (position: Position) => {
    if (checkMate || stalemate) return;

    const row = position[0];
    const col = position[1];

    // if piece selected and valid move
    if (
      selected &&
      validMoves?.some((move) => move[0] === row && move[1] === col)
    ) {
      const newBoard = board.map((row) => [...row]);
      const selectedPiece = board[selected[0]][selected[1]];

      newBoard[row][col] = { ...selectedPiece!, hasMoved: true };
      newBoard[selected[0]][selected[1]] = null;

      // handle castling
      if (selectedPiece?.type === "king" && Math.abs(col - selected[1]) === 2) {
        const backRank = currentTurn === "white" ? 7 : 0;

        if (col === 6) {
          // kingside castling
          newBoard[backRank][5] = { ...board[backRank][7]!, hasMoved: true };
          newBoard[backRank][7] = null;
        } else if (col === 2) {
          // queenside castling
          newBoard[backRank][3] = { ...board[backRank][0]!, hasMoved: true };
          newBoard[backRank][0] = null;
        }
      }

      // handle en passant
      if (
        selectedPiece?.type === "pawn" &&
        Math.abs(col - selected[1]) === 1 &&
        !board[row][col]
      ) {
        newBoard[selected[0]][col] = null;
      }

      // if the move doesnt put them in check
      if (!isInCheck(currentTurn, newBoard)) {
        const newLastMove: [Position, Position] = [
          [selected[0], selected[1]],
          [row, col],
        ];
        setBoard(newBoard);
        const nextTurn = currentTurn === "white" ? "black" : "white";

        if (isInCheck(nextTurn, newBoard)) {
          setInCheck(nextTurn);

          if (isCheckmate(nextTurn, newBoard, newLastMove)) {
            setCheckmate(true);
          }
        } else {
          setInCheck(null);

          // check for stalemate when not in check
          if (isStalemate(nextTurn, newBoard, newLastMove)) {
            setStalemate(true);
          }
        }

        setCurrentTurn(nextTurn);
        setLastMove(newLastMove);
      }

      setSelected(null);
      setValidMoves(null);
      return;
    }
    // if theres a correct color peice at this position
    else if (board[row][col] && board[row][col].color === currentTurn) {
      setSelected(position);
      const moves = generateMoves(row, col, board[row][col], board, lastMove);
      // find moves that dont put king in check
      const legalMoves = moves.filter(([mr, mc]) => {
        const testBoard = board.map((r) => [...r]);
        const movingPiece = testBoard[row][col];
        testBoard[mr][mc] = movingPiece;
        testBoard[row][col] = null;
        if (
          movingPiece?.type === "pawn" &&
          Math.abs(mc - col) === 1 &&
          !board[mr][mc]
        ) {
          testBoard[row][mc] = null;
        }
        return !isInCheck(currentTurn, testBoard);
      });
      setValidMoves(legalMoves);
    } else {
      setSelected(null);
      setValidMoves(null);
    }
  };

  const resetGame = (board = initialBoard) => {
    setBoard(board);
    setCheckmate(false);
    setStalemate(false);
    setCurrentTurn("white");
    setValidMoves(null);
    setLastMove(null);
    setSelected(null);
    setInCheck(null);
  };

  return (
    <div className="chess">
      <p>Turn: {currentTurn}</p>
      <p>Check: {inCheck}</p>
      {checkMate && (
        <p>Checkmate! {currentTurn === "white" ? "black" : "white"} wins!</p>
      )}
      {stalemate && <p>Stalemate! It's a draw</p>}
      <BoardDisplay
        board={board}
        selected={selected}
        validMoves={validMoves}
        lastMove={lastMove}
        currentTurn={currentTurn}
        inCheck={inCheck}
        handleSquareClick={handleSquareClick}
      />
      {debugMode &&
        testBoards.map((test) => (
          <button
            key={test.name}
            onClick={() => {
              resetGame();
              setBoard(test.board);
            }}
          >
            {test.name}
          </button>
        ))}
    </div>
  );
}
