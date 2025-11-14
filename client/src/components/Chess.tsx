import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  getLegalMoves,
  isCheckmate,
  isInCheck,
  isStalemate,
  makeMove,
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
  PieceType,
  Position,
} from "../types/chess_types";

import { initialBoard, testBoards } from "../game/boards";
import { getPing } from "../api/chess";

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

  const { data, error } = useQuery({
    queryKey: ["ping"],
    queryFn: getPing,
  });
  console.log(data);
  console.log(error);

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

  const handleSquareClick = (position: Position) => {
    if (checkMate || stalemate) return;
    const [row, col] = position;

    // if a piece is already selected check if its a valid move
    if (
      selected &&
      validMoves?.some((move) => move[0] === row && move[1] === col)
    ) {
      const res = makeMove(board, selected, position, currentTurn);
      if ("illegal" in res) {
        // move was illegal (e.g. leaves king in check) — ignore
        setSelected(null);
        setValidMoves(null);
        return;
      }
      if (res.promotionPending) {
        setBoard(res.board);
        setLastMove(res.lastMove);
        setPromotionPending(res.promotionPending);
        setSelected(null);
        setValidMoves(null);
        return;
      }

      finalizeMoveWithBoard(res.board, res.lastMove);
      setSelected(null);
      setValidMoves(null);
      return;
    }

    // if selecting a piece of the current turns color update the valid moves
    if (board[row][col]?.color === currentTurn) {
      setSelected(position);
      setValidMoves(getLegalMoves(board, row, col, lastMove, currentTurn));
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
