import { Position } from "../position";
import { Board } from "../board";
import { Game } from "../game";
import { King, Queen, Rook, Bishop, Knight, Pawn } from "../piece";

describe("Game", () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
  });

  describe("constructor", () => {
    it("should initialize game with starting position", () => {
      expect(game.currentTurn).toBe("white");
      expect(game.status).toBe("active");
      expect(game.moveHistory).toHaveLength(0);
      expect(game.board.getPiece(new Position(0, 0))).toBeInstanceOf(Rook);
    });
  });

  describe("getLegalMoves", () => {
    it("should return legal moves for pawn", () => {
      const moves = game.getLegalMoves(new Position(6, 4));
      expect(moves.length).toBeGreaterThan(0);
      expect(moves.some((m) => m.row === 5 && m.col === 4)).toBe(true);
      expect(moves.some((m) => m.row === 4 && m.col === 4)).toBe(true);
    });

    it("should return empty array for opponent piece", () => {
      const moves = game.getLegalMoves(new Position(1, 0));
      expect(moves).toHaveLength(0);
    });

    it("should not allow moves that leave king in check", () => {
      // Setup position where moving would expose king
      game = new Game();
      game.board = new Board();
      game.board.setPiece(new Position(0, 4), new King("white"));
      game.board.setPiece(new Position(0, 3), new Rook("white"));
      game.board.setPiece(new Position(0, 0), new Rook("black"));

      const moves = game.getLegalMoves(new Position(0, 3));
      // Rook is pinned, can only move along the pin line
      expect(moves.every((m) => m.row === 0)).toBe(true);
    });
  });

  describe("makeMove", () => {
    it("should make valid move", () => {
      const result = game.makeMove(new Position(6, 4), new Position(4, 4));
      expect(result).toBe(true);
      expect(game.currentTurn).toBe("black");
      expect(game.moveHistory).toHaveLength(1);
    });

    it("should reject invalid move", () => {
      const result = game.makeMove(new Position(6, 4), new Position(3, 4));
      expect(result).toBe(false);
      expect(game.currentTurn).toBe("white");
      expect(game.moveHistory).toHaveLength(0);
    });

    it("should handle captures", () => {
      game.makeMove(new Position(6, 4), new Position(4, 4));
      game.makeMove(new Position(1, 3), new Position(3, 3));
      game.makeMove(new Position(4, 4), new Position(3, 3));

      const lastMove = game.lastMove;
      expect(lastMove?.capturedPiece).toBeInstanceOf(Pawn);
    });

    it("should promote pawn", () => {
      game.board = new Board();
      game.board.setPiece(new Position(1, 0), new Pawn("white"));
      game.board.setPiece(new Position(0, 4), new King("black"));
      game.board.setPiece(new Position(7, 4), new King("white"));

      game.makeMove(new Position(1, 0), new Position(0, 0), "queen");
      expect(game.board.getPiece(new Position(0, 0))).toBeInstanceOf(Queen);
    });

    it("should truncate history when making move after undo", () => {
      game.makeMove(new Position(6, 4), new Position(4, 4));
      game.makeMove(new Position(1, 4), new Position(3, 4));
      game.undo();
      game.makeMove(new Position(1, 3), new Position(3, 3));

      expect(game.gameHistory).toHaveLength(3);
      expect(game.moveHistory).toHaveLength(2);
    });
  });

  describe("castling", () => {
    beforeEach(() => {
      game.board = new Board();
      game.board.setPiece(new Position(7, 4), new King("white"));
      game.board.setPiece(new Position(7, 0), new Rook("white"));
      game.board.setPiece(new Position(7, 7), new Rook("white"));
      game.board.setPiece(new Position(0, 4), new King("black"));
    });

    it("should allow kingside castling", () => {
      const moves = game.getLegalMoves(new Position(7, 4));
      expect(moves.some((m) => m.row === 7 && m.col === 6)).toBe(true);
    });

    it("should allow queenside castling", () => {
      const moves = game.getLegalMoves(new Position(7, 4));
      expect(moves.some((m) => m.row === 7 && m.col === 2)).toBe(true);
    });

    it("should perform kingside castle", () => {
      game.makeMove(new Position(7, 4), new Position(7, 6));
      expect(game.board.getPiece(new Position(7, 6))).toBeInstanceOf(King);
      expect(game.board.getPiece(new Position(7, 5))).toBeInstanceOf(Rook);
    });

    it("should perform queenside castle", () => {
      game.makeMove(new Position(7, 4), new Position(7, 2));
      expect(game.board.getPiece(new Position(7, 2))).toBeInstanceOf(King);
      expect(game.board.getPiece(new Position(7, 3))).toBeInstanceOf(Rook);
    });

    it("should not allow castling after king moved", () => {
      const king = game.board.getPiece(new Position(7, 4));
      king!.hasMoved = true;
      const moves = game.getLegalMoves(new Position(7, 4));
      expect(moves.some((m) => m.col === 6 || m.col === 2)).toBe(false);
    });

    it("should not allow castling through check", () => {
      game.board.setPiece(new Position(0, 5), new Rook("black"));
      const moves = game.getLegalMoves(new Position(7, 4));
      expect(moves.some((m) => m.col === 6)).toBe(false);
    });

    it("should not allow castling when in check", () => {
      game.board.setPiece(new Position(0, 4), new Rook("black"));
      const moves = game.getLegalMoves(new Position(7, 4));
      expect(moves.some((m) => m.col === 6 || m.col === 2)).toBe(false);
    });
  });

  describe("en passant", () => {
    it("should allow en passant capture", () => {
      game.board = new Board();
      game.board.setPiece(new Position(3, 4), new Pawn("white"));
      game.board.getPiece(new Position(3, 4))!.hasMoved = true;
      game.board.setPiece(new Position(1, 3), new Pawn("black"));
      game.board.setPiece(new Position(7, 4), new King("white"));
      game.board.setPiece(new Position(0, 4), new King("black"));
      game.currentTurn = "black";

      // Black pawn moves two squares
      game.makeMove(new Position(1, 3), new Position(3, 3));

      // White can capture en passant
      const moves = game.getLegalMoves(new Position(3, 4));
      expect(moves.some((m) => m.row === 2 && m.col === 3)).toBe(true);
    });

    it("should perform en passant capture", () => {
      game.board = new Board();
      game.board.setPiece(new Position(3, 4), new Pawn("white"));
      game.board.getPiece(new Position(3, 4))!.hasMoved = true;
      game.board.setPiece(new Position(1, 3), new Pawn("black"));
      game.board.setPiece(new Position(7, 4), new King("white"));
      game.board.setPiece(new Position(0, 4), new King("black"));
      game.currentTurn = "black";

      game.makeMove(new Position(1, 3), new Position(3, 3));
      game.makeMove(new Position(3, 4), new Position(2, 3));

      expect(game.board.getPiece(new Position(2, 3))).toBeInstanceOf(Pawn);
      expect(game.board.getPiece(new Position(3, 3))).toBeNull();
      expect(game.lastMove?.isEnPassant).toBe(true);
    });

    it("should not allow en passant if not immediately after double push", () => {
      game.board = new Board();
      game.board.setPiece(new Position(3, 4), new Pawn("white"));
      game.board.getPiece(new Position(3, 4))!.hasMoved = true;
      game.board.setPiece(new Position(1, 3), new Pawn("black"));
      game.board.setPiece(new Position(1, 5), new Pawn("black"));
      game.board.setPiece(new Position(7, 4), new King("white"));
      game.board.setPiece(new Position(0, 4), new King("black"));
      game.currentTurn = "black";

      game.makeMove(new Position(1, 3), new Position(3, 3));
      game.currentTurn = "black";
      game.makeMove(new Position(1, 5), new Position(2, 5));

      const moves = game.getLegalMoves(new Position(3, 4));
      expect(moves.some((m) => m.row === 2 && m.col === 3)).toBe(false);
    });
  });

  describe("check and checkmate", () => {
    it("should detect check", () => {
      game.board = new Board();
      game.board.setPiece(new Position(0, 4), new King("white"));
      game.board.setPiece(new Position(0, 0), new Rook("black"));
      game.board.setPiece(new Position(7, 7), new King("black"));

      expect(game.isCheck()).toBe(true);
    });

    it("should detect checkmate", () => {
      game.board = new Board();
      game.board.setPiece(new Position(0, 4), new King("white"));
      game.board.setPiece(new Position(0, 3), new Queen("black"));
      game.board.setPiece(new Position(1, 3), new Rook("black"));
      game.board.setPiece(new Position(7, 7), new King("black"));

      game.updateGameStatus();
      expect(game.isCheckmate()).toBe(true);
    });

    it("should detect stalemate", () => {
      game.board = new Board();
      game.board.setPiece(new Position(0, 0), new King("white"));
      game.board.setPiece(new Position(2, 1), new Queen("black"));
      game.board.setPiece(new Position(1, 2), new King("black"));

      game.updateGameStatus();
      expect(game.isStalemate()).toBe(true);
    });

    it("should mark move as check", () => {
      game.board = new Board();
      game.board.setPiece(new Position(7, 4), new King("white"));
      game.board.setPiece(new Position(0, 4), new King("black"));
      game.board.setPiece(new Position(7, 0), new Rook("white"));

      game.makeMove(new Position(7, 0), new Position(0, 0));
      expect(game.lastMove?.isCheck).toBe(true);
    });

    it("should not detect checkmate when only legal move is en passant", () => {
      game.board = new Board("8/8/3ppp2/3pkp2/3pp3/8/PPPPPPPP/5Q2");
      game.makeMove(new Position(6, 5), new Position(4, 5));

      expect(game.isCheckmate()).toBe(false);
    });
  });

  describe("undo and redo", () => {
    it("should undo move", () => {
      game.makeMove(new Position(6, 4), new Position(4, 4));
      const result = game.undo();

      expect(result).toBe(true);
      expect(game.currentTurn).toBe("white");
      expect(game.currentHistoryIndex).toBe(0);
      expect(game.board.getPiece(new Position(6, 4))).toBeInstanceOf(Pawn);
    });

    it("should not undo at start", () => {
      const result = game.undo();
      expect(result).toBe(false);
    });

    it("should redo move", () => {
      game.makeMove(new Position(6, 4), new Position(4, 4));
      game.undo();
      const result = game.redo();

      expect(result).toBe(true);
      expect(game.currentTurn).toBe("black");
      expect(game.board.getPiece(new Position(4, 4))).toBeInstanceOf(Pawn);
    });

    it("should not redo at end", () => {
      game.makeMove(new Position(6, 4), new Position(4, 4));
      const result = game.redo();
      expect(result).toBe(false);
    });

    it("should handle multiple undos", () => {
      game.makeMove(new Position(6, 4), new Position(4, 4));
      game.makeMove(new Position(1, 4), new Position(3, 4));
      game.makeMove(new Position(6, 3), new Position(5, 3));

      game.undo();
      game.undo();

      expect(game.currentHistoryIndex).toBe(1);
      expect(game.currentTurn).toBe("black");
    });

    it("should handle multiple redos", () => {
      game.makeMove(new Position(6, 4), new Position(4, 4));
      game.makeMove(new Position(1, 4), new Position(3, 4));
      game.undo();
      game.undo();
      game.redo();
      game.redo();

      expect(game.currentHistoryIndex).toBe(2);
      expect(game.currentTurn).toBe("white");
    });
  });

  describe("canUndo and canRedo", () => {
    it("should check if can undo", () => {
      expect(game.canUndo()).toBe(false);
      game.makeMove(new Position(6, 4), new Position(4, 4));
      expect(game.canUndo()).toBe(true);
    });

    it("should check if can redo", () => {
      game.makeMove(new Position(6, 4), new Position(4, 4));
      expect(game.canRedo()).toBe(false);
      game.undo();
      expect(game.canRedo()).toBe(true);
    });
  });

  describe("jumpToMove", () => {
    it("should jump to specific move", () => {
      game.makeMove(new Position(6, 4), new Position(4, 4));
      game.makeMove(new Position(1, 4), new Position(3, 4));
      game.makeMove(new Position(6, 3), new Position(5, 3));

      const result = game.jumpToMove(1);
      expect(result).toBe(true);
      expect(game.currentHistoryIndex).toBe(1);
      expect(game.currentTurn).toBe("black");
    });

    it("should not jump to invalid index", () => {
      expect(game.jumpToMove(-1)).toBe(false);
      expect(game.jumpToMove(100)).toBe(false);
    });
  });

  describe("isAtCurrentPosition", () => {
    it("should return true at latest position", () => {
      game.makeMove(new Position(6, 4), new Position(4, 4));
      expect(game.isAtCurrentPosition()).toBe(true);
    });

    it("should return false after undo", () => {
      game.makeMove(new Position(6, 4), new Position(4, 4));
      game.undo();
      expect(game.isAtCurrentPosition()).toBe(false);
    });
  });

  describe("getCurrentMoveNumber and getTotalMoves", () => {
    it("should track move numbers", () => {
      expect(game.getCurrentMoveNumber()).toBe(0);
      expect(game.getTotalMoves()).toBe(0);

      game.makeMove(new Position(6, 4), new Position(4, 4));
      expect(game.getCurrentMoveNumber()).toBe(1);
      expect(game.getTotalMoves()).toBe(1);

      game.makeMove(new Position(1, 4), new Position(3, 4));
      expect(game.getCurrentMoveNumber()).toBe(2);
      expect(game.getTotalMoves()).toBe(2);
    });
  });

  describe("getCurrentMove", () => {
    it("should return null at start", () => {
      expect(game.getCurrentMove()).toBeNull();
    });

    it("should return current move", () => {
      game.makeMove(new Position(6, 4), new Position(4, 4));
      const move = game.getCurrentMove();
      expect(move).not.toBeNull();
      expect(move?.toPos.row).toBe(4);
      expect(move?.toPos.col).toBe(4);
    });
  });

  describe("getMoveList", () => {
    it("should return list of moves in SAN", () => {
      game.makeMove(new Position(6, 4), new Position(4, 4));
      game.makeMove(new Position(1, 4), new Position(3, 4));

      const moves = game.getMoveList();
      expect(moves).toHaveLength(2);
      expect(moves[0]).toBe("e4");
      expect(moves[1]).toBe("e5");
    });
  });

  describe("serializeLegalMoves", () => {
    it("should serialize legal moves", () => {
      const moves = game.serializeLegalMoves(new Position(6, 4));
      expect(Array.isArray(moves)).toBe(true);
      expect(moves.length).toBeGreaterThan(0);
      expect(moves[0]).toHaveProperty("row");
      expect(moves[0]).toHaveProperty("col");
    });
  });

  describe("serializeHistory", () => {
    it("should serialize game history", () => {
      game.makeMove(new Position(6, 4), new Position(4, 4));
      const history = game.serializeHistory();

      expect(Array.isArray(history)).toBe(true);
      expect(history).toHaveLength(2);
      expect(history[0]).toHaveProperty("status");
      expect(history[0]).toHaveProperty("board");
    });
  });

  describe("display", () => {
    it("should display game state", () => {
      const display = game.display();
      expect(display).toContain("Current turn: white");
      expect(display).toContain("Status: active");
    });
  });

  describe("disambiguation", () => {
    it("should disambiguate by file when needed", () => {
      game.board = new Board();
      game.board.setPiece(new Position(7, 0), new Rook("white"));
      game.board.setPiece(new Position(7, 7), new Rook("white"));
      game.board.setPiece(new Position(6, 4), new King("white"));
      game.board.setPiece(new Position(0, 4), new King("black"));

      game.makeMove(new Position(7, 0), new Position(7, 1));
      expect(game.lastMove?.toSAN()).toBe("Rab1");
    });

    it("should disambiguate by rank when needed", () => {
      game.board = new Board();
      game.board.setPiece(new Position(0, 0), new Rook("white"));
      game.board.setPiece(new Position(7, 0), new Rook("white"));
      game.board.setPiece(new Position(7, 4), new King("white"));
      game.board.setPiece(new Position(1, 4), new King("black"));

      game.makeMove(new Position(7, 0), new Position(5, 0));
      expect(game.lastMove?.toSAN()).toBe("R1a3");
    });
  });

  describe("complex scenarios", () => {
    it("should handle scholar's mate", () => {
      game.makeMove(new Position(6, 4), new Position(4, 4)); // e4
      game.makeMove(new Position(1, 4), new Position(3, 4)); // e5
      game.makeMove(new Position(7, 5), new Position(4, 2)); // Bc4
      game.makeMove(new Position(0, 1), new Position(2, 2)); // Nc6
      game.makeMove(new Position(7, 3), new Position(3, 7)); // Qh5
      game.makeMove(new Position(0, 6), new Position(2, 5)); // Nf6
      game.makeMove(new Position(3, 7), new Position(1, 5)); // Qxf7#

      expect(game.isCheckmate()).toBe(true);
      expect(game.status).toBe("checkmate");
    });

    it("should prevent moving into check", () => {
      game.board = new Board();
      game.board.setPiece(new Position(4, 4), new King("white"));
      game.board.setPiece(new Position(0, 4), new Rook("black"));
      game.board.setPiece(new Position(7, 7), new King("black"));

      const moves = game.getLegalMoves(new Position(4, 4));
      expect(moves.some((m) => m.row === 3 && m.col === 4)).toBe(false);
      expect(moves.some((m) => m.row === 5 && m.col === 4)).toBe(false);
    });

    it("should handle pinned pieces", () => {
      game.board = new Board();
      game.board.setPiece(new Position(4, 4), new King("white"));
      game.board.setPiece(new Position(4, 5), new Bishop("white"));
      game.board.setPiece(new Position(4, 7), new Rook("black"));
      game.board.setPiece(new Position(0, 0), new King("black"));

      const moves = game.getLegalMoves(new Position(4, 5));
      // Bishop can only move along the pin line
      expect(moves.every((m) => m.row === 4)).toBe(true);
    });

    it("should handle blocking check", () => {
      game.board = new Board();
      game.board.setPiece(new Position(7, 4), new King("white"));
      game.board.setPiece(new Position(7, 3), new Bishop("white"));
      game.board.setPiece(new Position(0, 4), new Rook("black"));
      game.board.setPiece(new Position(0, 0), new King("black"));

      expect(game.isCheck()).toBe(true);

      const bishopMoves = game.getLegalMoves(new Position(7, 3));
      // Bishop can block by moving to a square between king and rook
      expect(bishopMoves.some((m) => m.row < 7 && m.col === 4)).toBe(true);
    });

    it("should handle capturing checking piece", () => {
      game.board = new Board();
      game.board.setPiece(new Position(7, 4), new King("white"));
      game.board.setPiece(new Position(5, 2), new Knight("white"));
      game.board.setPiece(new Position(4, 4), new Rook("black"));
      game.board.setPiece(new Position(0, 0), new King("black"));

      expect(game.isCheck()).toBe(true);

      const knightMoves = game.getLegalMoves(new Position(5, 2));
      expect(knightMoves.some((m) => m.row === 4 && m.col === 4)).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle empty board gracefully", () => {
      game.board = new Board();
      expect(game.board.findKing("white").row).toBe(-1);
    });

    it("should handle position with only kings", () => {
      game.board = new Board();
      game.board.setPiece(new Position(0, 0), new King("white"));
      game.board.setPiece(new Position(7, 7), new King("black"));

      game.updateGameStatus();
      expect(game.isStalemate()).toBe(true);
    });

    it("should not allow moving opponent pieces", () => {
      const result = game.makeMove(new Position(1, 0), new Position(2, 0));
      expect(result).toBe(false);
    });

    it("should handle promotion to different pieces", () => {
      game.board = new Board();
      game.board.setPiece(new Position(1, 0), new Pawn("white"));
      game.board.setPiece(new Position(0, 4), new King("black"));
      game.board.setPiece(new Position(7, 4), new King("white"));

      game.makeMove(new Position(1, 0), new Position(0, 0), "knight");
      expect(game.board.getPiece(new Position(0, 0))).toBeInstanceOf(Knight);

      game.board.setPiece(new Position(1, 1), new Pawn("white"));
      game.currentTurn = "white";
      game.makeMove(new Position(1, 1), new Position(0, 1), "rook");
      expect(game.board.getPiece(new Position(0, 1))).toBeInstanceOf(Rook);
    });
  });

  describe("lastMove property", () => {
    it("should return undefined when no moves made", () => {
      expect(game.lastMove).toBeUndefined();
    });

    it("should return last move after making moves", () => {
      game.makeMove(new Position(6, 4), new Position(4, 4));
      expect(game.lastMove).toBeDefined();
      expect(game.lastMove?.toPos.row).toBe(4);
      expect(game.lastMove?.toPos.col).toBe(4);
    });
  });
});
