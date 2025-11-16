import { useState, useRef, useEffect } from "react";

import BoardDisplay from "./BoardDisplay";
import PromotionModal from "./PromotionModal";
import MoveHistory from "./MoveHistory";
import MoveControls from "./MoveControls";

import { Game } from "../game/game";
import { GameStateManager } from "../game/gameStateManager";
// import { GameSerializer } from "../game/gameSerializer";
import { Position } from "../game/position";

import type { PositionData, BoardData, PieceType } from "../types/chess_types";
// import type { GameStateDTO } from "../game/types";
import "./Chess.css";

import { testBoards } from "./testBoards";
const DEBUG_MODE = true;

export default function Chess() {
  // Use GameStateManager instead of direct Game access
  const gameManager = useRef(new GameStateManager(new Game()));

  const [board, setBoard] = useState<BoardData>(() =>
    gameManager.current.getGame().Board.serializeBoard()
  );
  const [selected, setSelected] = useState<PositionData | null>(null);
  const [validMoves, setValidMoves] = useState<PositionData[] | null>(null);
  const [promotionPending, setPromotionPending] = useState<{
    from: Position;
    to: Position;
  } | null>(null);

  // For future multiplayer - track if we're in sync with server
  const [isSyncing, setIsSyncing] = useState(false);

  const game = gameManager.current.getGame();

  const updateBoard = () => {
    setBoard(game.Board.serializeBoard());
    setSelected(null);
    setValidMoves(null);
  };

  const handleSquareClick = (position: PositionData) => {
    if (game.Status !== "active") return;
    const { row, col } = position;
    const to_pos = new Position(position.row, position.col);

    // if a piece is already selected check if its a valid move
    if (
      selected &&
      validMoves?.some((move) => move.row === row && move.col === col)
    ) {
      const from_pos = new Position(selected.row, selected.col);
      const piece = game.Board.getPiece(from_pos);

      if (piece?.pieceType === "pawn") {
        const promotionRow = piece.color === "white" ? 0 : 7;
        if (to_pos.row === promotionRow) {
          setPromotionPending({ from: from_pos, to: to_pos });
          return;
        }
      }

      // Use GameStateManager for moves (makes it easier to add networking later)
      const response = gameManager.current.makeMove(from_pos, to_pos);
      if (!response.success) {
        setSelected(null);
        setValidMoves(null);
        return;
      }

      // For future multiplayer: send move to server here
      // await sendMoveToServer(response.gameState);

      updateBoard();
      return;
    }

    // if selecting a piece of the current turns color update the valid moves
    if (board[row][col]?.color === game.CurrentTurn) {
      setSelected(position);
      // Use manager's getLegalMoves (returns plain objects)
      const moves = gameManager.current.getLegalMoves(to_pos);
      setValidMoves(moves);
      return;
    }

    setSelected(null);
    setValidMoves(null);
  };

  const handlePromotion = (pieceType: PieceType) => {
    if (!promotionPending) return;

    const response = gameManager.current.makeMove(
      promotionPending.from,
      promotionPending.to,
      pieceType
    );

    if (response.success) {
      updateBoard();
    }

    setPromotionPending(null);
  };

  const handleUndo = () => {
    if (game.undo()) {
      updateBoard();
    }
  };

  const handleRedo = () => {
    if (game.redo()) {
      updateBoard();
    }
  };

  const handleJumpToMove = (index: number) => {
    if (game.jumpToMove(index)) {
      updateBoard();
    }
  };

  const handleJumpToStart = () => {
    handleJumpToMove(0);
  };

  const handleJumpToEnd = () => {
    handleJumpToMove(game.getTotalMoves());
  };

  const handleReset = () => {
    game.resetGame();
    updateBoard();
  };

  const handleNewGame = (fen: string) => {
    gameManager.current = new GameStateManager(new Game(fen));
    updateBoard();
  };

  // New: Export game state (useful for saving/sharing games)
  const handleExportGame = () => {
    const gameState = gameManager.current.getState();
    const json = JSON.stringify(gameState, null, 2);

    // Copy to clipboard
    navigator.clipboard.writeText(json);
    console.log("Game state copied to clipboard:", gameState);
  };

  // // New: Import game state (useful for loading saved games)
  // const handleImportGame = (gameStateDTO: GameStateDTO) => {
  //   const newGame = GameSerializer.deserializeGame(gameStateDTO);
  //   gameManager.current = new GameStateManager(newGame);
  //   updateBoard();
  // };

  // New: Simulate receiving game state from server
  const handleSyncWithServer = async () => {
    setIsSyncing(true);

    // In real multiplayer, you'd fetch from server:
    // const gameState = await fetchGameState(gameId);

    // For demo, just use current state
    const gameState = gameManager.current.getState();

    // Apply the state
    gameManager.current.applyRemoteState(gameState);
    updateBoard();

    setIsSyncing(false);
  };

  const currentTurn = game.CurrentTurn;
  const gameStatus = game.Status;
  const canUndo = game.canUndo();
  const canRedo = game.canRedo();
  const currentMoveIndex = game.getCurrentMoveNumber();
  const currentMove = game.getCurrentMove();

  const lastMove = currentMove
    ? {
        from_pos: currentMove.fromPos.serializePosition(),
        to_pos: currentMove.toPos.serializePosition(),
      }
    : null;

  const inCheck = game.isCheck()
    ? game.Board.findKing(currentTurn).serializePosition()
    : null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleUndo();
      }
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
        totalMoves={game.getTotalMoves()}
        handleRedo={handleRedo}
        handleUndo={handleUndo}
        handleJumpToStart={handleJumpToStart}
        handleJumpToEnd={handleJumpToEnd}
      />

      <div className="button-group">
        <button onClick={handleReset}>Reset</button>
        <button onClick={handleExportGame}>Export Game</button>
        <button onClick={handleSyncWithServer} disabled={isSyncing}>
          {isSyncing ? "Syncing..." : "Sync State"}
        </button>
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
          inCheck={inCheck}
          handleSquareClick={handleSquareClick}
        />
        <MoveHistory
          moves={game.getMoveList()}
          historyIndex={currentMoveIndex}
          onMoveClick={handleJumpToMove}
        />
      </div>

      {DEBUG_MODE && (
        <>
          {testBoards.map((b) => (
            <button key={b.name} onClick={() => handleNewGame(b.board)}>
              {b.name}
            </button>
          ))}
        </>
      )}
    </div>
  );
}
