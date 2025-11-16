import { Board } from "../board";
import { King, Pawn, Queen, Rook, Bishop, Knight } from "../piece";
import { Position } from "../position";

describe("Piece", () => {
  let board: Board;

  beforeEach(() => {
    board = new Board();
  });

  describe("King", () => {
    it("should have correct properties", () => {
      const king = new King("white");
      expect(king.color).toBe("white");
      expect(king.pieceType).toBe("king");
      expect(king.symbol()).toBe("K");
      expect(king.hasMoved).toBe(false);
    });

    it("should get all possible king moves", () => {
      board.setPiece(new Position(4, 4), new King("white"));
      const moves = board
        .getPiece(new Position(4, 4))!
        .getPossibleMoves(new Position(4, 4), board);
      expect(moves).toHaveLength(8);
    });

    it("should not move to squares with same color pieces", () => {
      board.setPiece(new Position(4, 4), new King("white"));
      board.setPiece(new Position(3, 3), new Pawn("white"));
      const moves = board
        .getPiece(new Position(4, 4))!
        .getPossibleMoves(new Position(4, 4), board);
      expect(moves.some((m) => m.row === 3 && m.col === 3)).toBe(false);
    });

    it("should capture opponent pieces", () => {
      board.setPiece(new Position(4, 4), new King("white"));
      board.setPiece(new Position(3, 3), new Pawn("black"));
      const moves = board
        .getPiece(new Position(4, 4))!
        .getPossibleMoves(new Position(4, 4), board);
      expect(moves.some((m) => m.row === 3 && m.col === 3)).toBe(true);
    });
  });

  describe("Queen", () => {
    it("should have correct properties", () => {
      const queen = new Queen("black");
      expect(queen.color).toBe("black");
      expect(queen.pieceType).toBe("queen");
      expect(queen.symbol()).toBe("q");
    });

    it("should move in all directions", () => {
      board.setPiece(new Position(4, 4), new Queen("white"));
      const moves = board
        .getPiece(new Position(4, 4))!
        .getPossibleMoves(new Position(4, 4), board);
      expect(moves.length).toBeGreaterThan(20);
    });

    it("should be blocked by pieces", () => {
      board.setPiece(new Position(4, 4), new Queen("white"));
      board.setPiece(new Position(4, 6), new Pawn("white"));
      const moves = board
        .getPiece(new Position(4, 4))!
        .getPossibleMoves(new Position(4, 4), board);
      expect(moves.some((m) => m.row === 4 && m.col === 7)).toBe(false);
    });
  });

  describe("Rook", () => {
    it("should have correct properties", () => {
      const rook = new Rook("white");
      expect(rook.pieceType).toBe("rook");
      expect(rook.symbol()).toBe("R");
    });

    it("should move horizontally and vertically", () => {
      board.setPiece(new Position(4, 4), new Rook("white"));
      const moves = board
        .getPiece(new Position(4, 4))!
        .getPossibleMoves(new Position(4, 4), board);
      expect(moves).toHaveLength(14);
    });
  });

  describe("Bishop", () => {
    it("should have correct properties", () => {
      const bishop = new Bishop("black");
      expect(bishop.pieceType).toBe("bishop");
      expect(bishop.symbol()).toBe("b");
    });

    it("should move diagonally", () => {
      board.setPiece(new Position(4, 4), new Bishop("white"));
      const moves = board
        .getPiece(new Position(4, 4))!
        .getPossibleMoves(new Position(4, 4), board);
      expect(moves).toHaveLength(13);
    });
  });

  describe("Knight", () => {
    it("should have correct properties", () => {
      const knight = new Knight("white");
      expect(knight.pieceType).toBe("knight");
      expect(knight.symbol()).toBe("N");
    });

    it("should move in L-shape", () => {
      board.setPiece(new Position(4, 4), new Knight("white"));
      const moves = board
        .getPiece(new Position(4, 4))!
        .getPossibleMoves(new Position(4, 4), board);
      expect(moves).toHaveLength(8);
    });

    it("should jump over pieces", () => {
      board.setPiece(new Position(4, 4), new Knight("white"));
      board.setPiece(new Position(3, 4), new Pawn("white"));
      board.setPiece(new Position(4, 3), new Pawn("white"));
      const moves = board
        .getPiece(new Position(4, 4))!
        .getPossibleMoves(new Position(4, 4), board);
      expect(moves).toHaveLength(8); // Should still have all moves
    });
  });

  describe("Pawn", () => {
    it("should have correct properties", () => {
      const pawn = new Pawn("white");
      expect(pawn.pieceType).toBe("pawn");
      expect(pawn.symbol()).toBe("P");
    });

    it("should move forward one square", () => {
      board.setPiece(new Position(6, 4), new Pawn("white"));
      const piece = board.getPiece(new Position(6, 4))!;
      piece.hasMoved = true;
      const moves = piece.getPossibleMoves(new Position(6, 4), board);
      expect(moves).toHaveLength(1);
      expect(moves[0].row).toBe(5);
    });

    it("should move forward two squares from starting position", () => {
      board.setPiece(new Position(6, 4), new Pawn("white"));
      const moves = board
        .getPiece(new Position(6, 4))!
        .getPossibleMoves(new Position(6, 4), board);
      expect(moves).toHaveLength(2);
    });

    it("should capture diagonally", () => {
      board.setPiece(new Position(6, 4), new Pawn("white"));
      board.setPiece(new Position(5, 3), new Pawn("black"));
      board.setPiece(new Position(5, 5), new Pawn("black"));
      const moves = board
        .getPiece(new Position(6, 4))!
        .getPossibleMoves(new Position(6, 4), board);
      expect(moves.length).toBeGreaterThanOrEqual(3);
    });

    it("should not move forward if blocked", () => {
      board.setPiece(new Position(6, 4), new Pawn("white"));
      board.setPiece(new Position(5, 4), new Pawn("black"));
      const moves = board
        .getPiece(new Position(6, 4))!
        .getPossibleMoves(new Position(6, 4), board);
      expect(moves).toHaveLength(0);
    });

    it("should have getAttackPositions method", () => {
      const pawn = new Pawn("white");
      board.setPiece(new Position(6, 4), pawn);
      const attacks = pawn.getAttackPositions(new Position(6, 4));
      expect(attacks).toHaveLength(2);
      expect(attacks.some((p) => p.row === 5 && p.col === 3)).toBe(true);
      expect(attacks.some((p) => p.row === 5 && p.col === 5)).toBe(true);
    });
  });

  describe("serializePiece", () => {
    it("should serialize piece data", () => {
      const queen = new Queen("white");
      const data = queen.serializePiece();
      expect(data).toEqual({
        type: "queen",
        color: "white",
        hasMoved: false,
      });
    });
  });
});
