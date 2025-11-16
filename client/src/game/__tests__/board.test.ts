import { Board } from "../board";
import { Rook, King, Pawn, Queen } from "../piece";
import { Position } from "../position";

describe("Board", () => {
  let board: Board;

  beforeEach(() => {
    board = new Board();
  });

  describe("constructor", () => {
    it("should create empty board by default", () => {
      expect(board.grid).toHaveLength(8);
      expect(board.grid[0]).toHaveLength(8);
    });

    it("should create board from FEN", () => {
      const fenBoard = new Board("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
      const piece = fenBoard.getPiece(new Position(0, 0));
      expect(piece).toBeInstanceOf(Rook);
      expect(piece?.color).toBe("black");
    });
  });

  describe("getPiece and setPiece", () => {
    it("should get and set pieces", () => {
      const king = new King("white");
      board.setPiece(new Position(0, 0), king);
      expect(board.getPiece(new Position(0, 0))).toBe(king);
    });

    it("should return null for empty square", () => {
      expect(board.getPiece(new Position(0, 0))).toBeNull();
    });
  });

  describe("movePiece", () => {
    it("should move piece and set hasMoved", () => {
      const king = new King("white");
      board.setPiece(new Position(0, 0), king);
      board.movePiece(new Position(0, 0), new Position(1, 1));

      expect(board.getPiece(new Position(0, 0))).toBeNull();
      expect(board.getPiece(new Position(1, 1))).toBe(king);
      expect(king.hasMoved).toBe(true);
    });

    it("should return captured piece", () => {
      const king = new King("white");
      const pawn = new Pawn("black");
      board.setPiece(new Position(0, 0), king);
      board.setPiece(new Position(1, 1), pawn);

      const captured = board.movePiece(new Position(0, 0), new Position(1, 1));
      expect(captured).toBe(pawn);
    });
  });

  describe("clone", () => {
    it("should create independent copy of board", () => {
      board.setPiece(new Position(0, 0), new King("white"));
      const cloned = board.clone();

      cloned.setPiece(new Position(0, 0), new Queen("black"));

      expect(board.getPiece(new Position(0, 0))).toBeInstanceOf(King);
      expect(cloned.getPiece(new Position(0, 0))).toBeInstanceOf(Queen);
    });
  });

  describe("getAllPieces", () => {
    it("should return all pieces of specified color", () => {
      board.setupInitialPosition();
      const whitePieces = board.getAllPieces("white");
      expect(whitePieces).toHaveLength(16);

      const blackPieces = board.getAllPieces("black");
      expect(blackPieces).toHaveLength(16);
    });
  });

  describe("isSquareUnderAttack", () => {
    it("should detect attacked square", () => {
      board.setPiece(new Position(0, 0), new Rook("white"));
      expect(board.isSquareUnderAttack(new Position(0, 7), "white")).toBe(true);
      expect(board.isSquareUnderAttack(new Position(7, 0), "white")).toBe(true);
    });

    it("should detect pawn attacks correctly", () => {
      board.setPiece(new Position(6, 4), new Pawn("white"));
      expect(board.isSquareUnderAttack(new Position(5, 3), "white")).toBe(true);
      expect(board.isSquareUnderAttack(new Position(5, 5), "white")).toBe(true);
      expect(board.isSquareUnderAttack(new Position(5, 4), "white")).toBe(
        false
      );
    });
  });

  describe("findKing", () => {
    it("should find king position", () => {
      board.setupInitialPosition();
      const whiteKing = board.findKing("white");
      expect(whiteKing.row).toBe(7);
      expect(whiteKing.col).toBe(4);
    });

    it("should return invalid position if no king", () => {
      const pos = board.findKing("white");
      expect(pos.row).toBe(-1);
      expect(pos.col).toBe(-1);
    });
  });

  describe("isInCheck", () => {
    it("should detect check", () => {
      board.setPiece(new Position(0, 0), new King("white"));
      board.setPiece(new Position(0, 7), new Rook("black"));
      expect(board.isInCheck("white")).toBe(true);
    });

    it("should return false when not in check", () => {
      board.setupInitialPosition();
      expect(board.isInCheck("white")).toBe(false);
    });
  });

  describe("setupInitialPosition", () => {
    it("should set up standard chess position", () => {
      board.setupInitialPosition();

      // Check white pieces
      expect(board.getPiece(new Position(7, 0))).toBeInstanceOf(Rook);
      expect(board.getPiece(new Position(7, 4))).toBeInstanceOf(King);
      expect(board.getPiece(new Position(6, 0))).toBeInstanceOf(Pawn);

      // Check black pieces
      expect(board.getPiece(new Position(0, 0))).toBeInstanceOf(Rook);
      expect(board.getPiece(new Position(0, 4))).toBeInstanceOf(King);
      expect(board.getPiece(new Position(1, 0))).toBeInstanceOf(Pawn);
    });
  });

  describe("display", () => {
    it("should return string representation", () => {
      board.setupInitialPosition();
      const display = board.display();
      expect(display).toContain("r");
      expect(display).toContain("R");
      expect(display).toContain(".");
    });
  });
});
