import { useEffect, useState } from "react";
import {
  generateMoves,
  isCheckmate,
  isInCheck,
  isStalemate,
  promotePawn,
} from "../game/game_logic";
import BoardDisplay from "./BoardDisplay";
import PromotionModal from "./PromotionModal";
import History from "./History";
import "./Chess.css";

import type {
  Board,
  Color,
  GameState,
  Piece,
  PieceType,
  Position,
} from "../types/chess_types";

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

  const [promotionPending, setPromotionPending] = useState<{
    position: Position;
    color: Color;
  } | null>(null);

  const [history, setHistory] = useState<GameState[]>([
    {
      board: initialBoard,
      lastMove: null,
      currentTurn: "white",
      inCheck: null,
      checkMate: false,
      stalemate: false,
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    console.log(board);
  }, [board]);

  const saveToHistory = (state: GameState) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const restoreState = (state: GameState) => {
    setBoard(state.board);
    setLastMove(state.lastMove);
    setCurrentTurn(state.currentTurn);
    setInCheck(state.inCheck);
    setCheckmate(state.checkMate);
    setStalemate(state.stalemate);
    setSelected(null);
    setValidMoves(null);
  };

  const jumpToMove = (index: number) => {
    setHistoryIndex(index);
    restoreState(history[index]);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      restoreState(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      restoreState(history[newIndex]);
    }
  };

  // handles castling and en passant
  const applySpecialMoves = (
    newBoard: Board,
    selectedPiece: Piece | null,
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

  const checkPawnPromotion = (piece: Piece | null, toRow: number): boolean => {
    if (piece?.type !== "pawn") return false;
    return (
      (piece.color === "white" && toRow === 0) ||
      (piece.color === "black" && toRow === 7)
    );
  };

  const handlePromotion = (pieceType: PieceType) => {
    if (!promotionPending) return;

    const { position } = promotionPending;
    const [row, col] = position;

    const newBoard = promotePawn(board, row, col, pieceType);

    finalizeMoveWithBoard(newBoard, lastMove!);
    setPromotionPending(null);
  };

  const finalizeMoveWithBoard = (
    newBoard: Board,
    newLastMove: [Position, Position]
  ) => {
    const nextTurn = currentTurn === "white" ? "black" : "white";

    let newInCheck: Color | null = null;
    let newCheckmate = false;
    let newStalemate = false;

    if (isInCheck(nextTurn, newBoard)) {
      newInCheck = nextTurn;
      if (isCheckmate(nextTurn, newBoard, newLastMove)) {
        newCheckmate = true;
      }
    } else {
      if (isStalemate(nextTurn, newBoard, newLastMove)) {
        newStalemate = true;
      }
    }

    setBoard(newBoard);
    setLastMove(newLastMove);
    setCurrentTurn(nextTurn);
    setInCheck(newInCheck);
    setCheckmate(newCheckmate);
    setStalemate(newStalemate);

    saveToHistory({
      board: newBoard,
      lastMove: newLastMove,
      currentTurn: nextTurn,
      inCheck: newInCheck,
      checkMate: newCheckmate,
      stalemate: newStalemate,
    });
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

    // check for pawn promotion
    if (checkPawnPromotion(selectedPiece, toRow)) {
      setBoard(newBoard);
      setLastMove(newLastMove);
      setPromotionPending({
        position: toPos,
        color: selectedPiece!.color,
      });
      return true;
    }

    // regular move completion
    finalizeMoveWithBoard(newBoard, newLastMove);
    return true;
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

  const resetGame = (newBoard = initialBoard) => {
    const initialState: GameState = {
      board: newBoard,
      lastMove: null,
      currentTurn: "white",
      inCheck: null,
      checkMate: false,
      stalemate: false,
    };

    setBoard(newBoard);
    setCheckmate(false);
    setStalemate(false);
    setCurrentTurn("white");
    setValidMoves(null);
    setLastMove(null);
    setSelected(null);
    setInCheck(null);

    setHistory([initialState]);
    setHistoryIndex(0);
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && canUndo) {
        handleUndo();
      } else if (e.key === "ArrowRight" && canRedo) {
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [canUndo, canRedo, historyIndex]);

  return (
    <div className="chess">
      <p>Turn: {currentTurn}</p>
      <p>Check: {inCheck}</p>
      {checkMate && (
        <p>Checkmate! {currentTurn === "white" ? "black" : "white"} wins!</p>
      )}
      {stalemate && <p>Stalemate! It's a draw</p>}

      <div className="controls">
        <button onClick={handleUndo} disabled={!canUndo}>
          Undo (←)
        </button>
        <button onClick={handleRedo} disabled={!canRedo}>
          Redo (→)
        </button>
        <button onClick={() => resetGame()}>Reset Game</button>
        <span style={{ marginLeft: "10px", color: "#666" }}>
          Move {historyIndex} / {history.length - 1}
        </span>
      </div>

      <div className="game-container">
        {promotionPending && (
          <PromotionModal
            color={currentTurn}
            handlePromotion={handlePromotion}
          />
        )}

        <BoardDisplay
          board={board}
          selected={selected}
          validMoves={validMoves}
          lastMove={lastMove}
          currentTurn={currentTurn}
          inCheck={inCheck}
          handleSquareClick={handleSquareClick}
        />
        <History
          history={history}
          historyIndex={historyIndex}
          onMoveClick={jumpToMove}
        />
      </div>

      {debugMode &&
        testBoards.map((test) => (
          <button
            key={test.name}
            onClick={() => {
              resetGame(test.board);
            }}
          >
            {test.name}
          </button>
        ))}
    </div>
  );
}
