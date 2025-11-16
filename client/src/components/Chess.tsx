import { useState, useRef, useEffect } from "react";

import BoardDisplay from "./BoardDisplay";
import PromotionModal from "./PromotionModal";
import MoveHistory from "./MoveHistory";
import MoveControls from "./MoveControls";

import { Game } from "../game/game";
import { Position } from "../game/position";

import type { PositionData, BoardData, PieceType } from "../types/chess_types";
import "./Chess.css";

import { testBoards } from "./testBoards";
const DEBUG_MODE = true;

export default function Chess() {
  const game = useRef(new Game());

  const [board, setBoard] = useState<BoardData>(() =>
    game.current.board.serializeBoard()
  );
  const [selected, setSelected] = useState<PositionData | null>(null);
  const [validMoves, setValidMoves] = useState<PositionData[] | null>(null);
  const [promotionPending, setPromotionPending] = useState<{
    from: Position;
    to: Position;
  } | null>(null);

  const updateBoard = () => {
    setBoard(game.current.board.serializeBoard());
    setSelected(null);
    setValidMoves(null);
  };

  const handleSquareClick = (position: PositionData) => {
    if (game.current.status !== "active") return;
    const { row, col } = position;
    const to_pos = new Position(position.row, position.col);

    // if a piece is already selected check if its a valid move
    if (
      selected &&
      validMoves?.some((move) => move.row === row && move.col === col)
    ) {
      const from_pos = new Position(selected.row, selected.col);
      const piece = game.current.board.getPiece(from_pos);

      if (piece?.pieceType === "pawn") {
        const promotionRow = piece.color === "white" ? 0 : 7;
        if (to_pos.row === promotionRow) {
          // show promotion modal instead of making the move
          setPromotionPending({ from: from_pos, to: to_pos });
          return;
        }
      }

      const result = game.current.makeMove(from_pos, to_pos);
      if (!result) {
        // move was illegal
        setSelected(null);
        setValidMoves(null);
        return;
      }

      updateBoard();
      return;
    }

    // if selecting a piece of the current turns color update the valid moves
    if (board[row][col]?.color === game.current.currentTurn) {
      setSelected(position);
      const validMoves = game.current.serializeLegalMoves(to_pos);
      setValidMoves(validMoves);
      return;
    }

    // otherwise deselect current piece
    setSelected(null);
    setValidMoves(null);
  };

  const handlePromotion = (pieceType: PieceType) => {
    if (!promotionPending) return;

    const result = game.current.makeMove(
      promotionPending.from,
      promotionPending.to,
      pieceType
    );

    if (result) {
      updateBoard();
    }

    setPromotionPending(null);
  };

  const handleUndo = () => {
    if (game.current.undo()) {
      updateBoard();
    }
  };

  const handleRedo = () => {
    if (game.current.redo()) {
      updateBoard();
    }
  };

  const handleJumpToMove = (index: number) => {
    if (game.current.jumpToMove(index)) {
      updateBoard();
    }
  };

  const handleJumpToStart = () => {
    handleJumpToMove(0);
  };

  const handleJumpToEnd = () => {
    handleJumpToMove(game.current.getTotalMoves());
  };

  const handleReset = () => {
    game.current.resetGame();
    updateBoard();
  };

  const handleNewGame = (fen: string) => {
    game.current = new Game(fen);
    updateBoard();
  };

  const currentTurn = game.current.currentTurn;
  const gameStatus = game.current.status;
  const canUndo = game.current.canUndo();
  const canRedo = game.current.canRedo();
  const currentMoveIndex = game.current.getCurrentMoveNumber();
  const currentMove = game.current.getCurrentMove();

  const lastMove = currentMove
    ? {
        from_pos: currentMove.fromPos.serializePosition(),
        to_pos: currentMove.toPos.serializePosition(),
      }
    : null;

  const inCheck = game.current.isCheck()
    ? game.current.board.findKing(currentTurn).serializePosition()
    : null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Left arrow = undo
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleUndo();
      }

      // Right arrow = redo
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="chess">
      <MoveControls
        gameStatus={gameStatus}
        currentTurn={currentTurn}
        canRedo={canRedo}
        canUndo={canUndo}
        currentMoveIndex={currentMoveIndex}
        totalMoves={game.current.getTotalMoves()}
        handleRedo={handleRedo}
        handleUndo={handleUndo}
        handleJumpToStart={handleJumpToStart}
        handleJumpToEnd={handleJumpToEnd}
      />

      <button onClick={handleReset}>Reset</button>

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
          inCheck={inCheck}
          handleSquareClick={handleSquareClick}
        />
        <MoveHistory
          moves={game.current.getMoveList()}
          historyIndex={currentMoveIndex}
          onMoveClick={handleJumpToMove}
        />
      </div>
      {DEBUG_MODE &&
        testBoards.map((b) => (
          <button key={b.name} onClick={() => handleNewGame(b.board)}>
            {b.name}
          </button>
        ))}
    </div>
  );
}
