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

  // handles castling and en passant
  const applySpecialMoves = (
    newBoard: Board,
    selectedPiece: any,
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number
  ) => {
    // handle castling
    if (selectedPiece?.type === "king" && Math.abs(toCol - fromCol) === 2) {
      const backRank = currentTurn === "white" ? 7 : 0;

      if (toCol === 6) {
        // kingside
        newBoard[backRank][5] = { ...board[backRank][7]!, hasMoved: true };
        newBoard[backRank][7] = null;
      } else if (toCol === 2) {
        // queenside
        newBoard[backRank][3] = { ...board[backRank][0]!, hasMoved: true };
        newBoard[backRank][0] = null;
      }
    }

    // handle en passant
    if (
      selectedPiece?.type === "pawn" &&
      Math.abs(toCol - fromCol) === 1 &&
      !board[toRow][toCol]
    ) {
      newBoard[fromRow][toCol] = null;
    }
  };

  const executeMove = (fromPos: Position, toPos: Position) => {
    const [fromRow, fromCol] = fromPos;
    const [toRow, toCol] = toPos;
    const selectedPiece = board[fromRow][fromCol];

    const newBoard = board.map((row) => [...row]);
    newBoard[toRow][toCol] = { ...selectedPiece!, hasMoved: true };
    newBoard[fromRow][fromCol] = null;

    applySpecialMoves(newBoard, selectedPiece, fromRow, fromCol, toRow, toCol);

    // make sure the move is legal
    if (isInCheck(currentTurn, newBoard)) {
      return false;
    }

    const newLastMove: [Position, Position] = [fromPos, toPos];
    const nextTurn = currentTurn === "white" ? "black" : "white";

    setBoard(newBoard);
    setLastMove(newLastMove);
    setCurrentTurn(nextTurn);

    // Check game end conditions
    checkGameEndConditions(nextTurn, newBoard, newLastMove);

    return true;
  };

  const checkGameEndConditions = (
    nextTurn: Color,
    newBoard: Board,
    newLastMove: [Position, Position]
  ) => {
    if (isInCheck(nextTurn, newBoard)) {
      setInCheck(nextTurn);
      if (isCheckmate(nextTurn, newBoard, newLastMove)) {
        setCheckmate(true);
      }
    } else {
      setInCheck(null);
      if (isStalemate(nextTurn, newBoard, newLastMove)) {
        setStalemate(true);
      }
    }
  };

  const calculateLegalMoves = (row: number, col: number): Position[] => {
    const piece = board[row][col];
    if (!piece) return [];

    const moves = generateMoves(row, col, piece, board, lastMove);

    // filter out moves that would put own king in check
    return moves.filter(([mr, mc]) => {
      const testBoard = board.map((r) => [...r]);
      const movingPiece = testBoard[row][col];
      testBoard[mr][mc] = movingPiece;
      testBoard[row][col] = null;

      // handle en passant
      if (
        movingPiece?.type === "pawn" &&
        Math.abs(mc - col) === 1 &&
        !board[mr][mc]
      ) {
        testBoard[row][mc] = null;
      }

      return !isInCheck(currentTurn, testBoard);
    });
  };

  const handleSquareClick = (position: Position) => {
    if (checkMate || stalemate) return;

    const [row, col] = position;

    // if a piece is already selected check if its a valid move
    if (
      selected &&
      validMoves?.some((move) => move[0] === row && move[1] === col)
    ) {
      executeMove(selected, position);
      setSelected(null);
      setValidMoves(null);
      return;
    }

    // if selecting a piece of the current turns color update the valid moves
    if (board[row][col]?.color === currentTurn) {
      setSelected(position);
      setValidMoves(calculateLegalMoves(row, col));
      return;
    }

    // otherwise deselect current piece
    setSelected(null);
    setValidMoves(null);
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
      <button onClick={() => resetGame()}>Reset Game</button>
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
