import { Move } from "../move";
import { Pawn, Knight, King, Queen, Rook } from "../piece";
import { Position } from "../position";

describe("Move", () => {
  describe("constructor", () => {
    it("should create move with positions", () => {
      const from = new Position(6, 4);
      const to = new Position(4, 4);
      const move = new Move(from, to);

      expect(move.fromPos).toBe(from);
      expect(move.toPos).toBe(to);
      expect(move.capturedPiece).toBeNull();
    });

    it("should create move with promotion", () => {
      const move = new Move(new Position(1, 0), new Position(0, 0), "queen");
      expect(move.promotionPiece).toBe("queen");
    });
  });

  describe("toString", () => {
    it("should return string representation", () => {
      const move = new Move(new Position(6, 4), new Position(4, 4));
      expect(move.toString()).toContain("e2");
      expect(move.toString()).toContain("e4");
    });
  });

  describe("toSAN", () => {
    it("should format pawn move", () => {
      const move = new Move(new Position(6, 4), new Position(4, 4));
      move.movingPiece = new Pawn("white");
      expect(move.toSAN()).toBe("e4");
    });

    it("should format piece move", () => {
      const move = new Move(new Position(7, 1), new Position(5, 2));
      move.movingPiece = new Knight("white");
      expect(move.toSAN()).toBe("Nc3");
    });

    it("should format capture", () => {
      const move = new Move(new Position(6, 4), new Position(5, 3));
      move.movingPiece = new Pawn("white");
      move.capturedPiece = new Pawn("black");
      expect(move.toSAN()).toBe("exd3");
    });

    it("should format kingside castling", () => {
      const move = new Move(new Position(7, 4), new Position(7, 6));
      move.isCastling = true;
      move.movingPiece = new King("white");
      expect(move.toSAN()).toBe("O-O");
    });

    it("should format queenside castling", () => {
      const move = new Move(new Position(7, 4), new Position(7, 2));
      move.isCastling = true;
      move.movingPiece = new King("white");
      expect(move.toSAN()).toBe("O-O-O");
    });

    it("should format check", () => {
      const move = new Move(new Position(7, 3), new Position(3, 7));
      move.movingPiece = new Queen("white");
      move.isCheck = true;
      expect(move.toSAN()).toBe("Qh5+");
    });

    it("should format checkmate", () => {
      const move = new Move(new Position(7, 3), new Position(3, 7));
      move.movingPiece = new Queen("white");
      move.isCheckmate = true;
      expect(move.toSAN()).toBe("Qh5#");
    });

    it("should format promotion", () => {
      const move = new Move(new Position(1, 0), new Position(0, 0), "queen");
      move.movingPiece = new Pawn("white");
      expect(move.toSAN()).toBe("a8=Q");
    });

    it("should format disambiguation by file", () => {
      const move = new Move(new Position(7, 0), new Position(5, 0));
      move.movingPiece = new Rook("white");
      move.disambiguationInfo = { needsFile: true };
      expect(move.toSAN()).toBe("Raa3");
    });
  });
});
