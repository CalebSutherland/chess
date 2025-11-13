import {
  generateMoves,
  isInCheck,
  isCheckmate,
  isStalemate,
  findKingPos,
  isSquareUnderAttack,
  shouldPromote,
  promotePawn,
} from "../game_logic";
import { createBoardFromFEN } from "../boards";
import type { Piece, Position } from "../../types/chess_types";

describe("Chess Game Logic Tests", () => {
  describe("findKingPos", () => {
    it("should find white king position", () => {
      const board = createBoardFromFEN("8/8/8/8/8/8/8/4K3");

      const pos = findKingPos("white", board);
      expect(pos).toEqual([7, 4]);
    });

    it("should find black king position", () => {
      const board = createBoardFromFEN("4k3/8/8/8/8/8/8/8");

      const pos = findKingPos("black", board);
      expect(pos).toEqual([0, 4]);
    });

    it("should return null when king is not found", () => {
      const board = createBoardFromFEN("8/8/8/8/8/8/8/8");
      const pos = findKingPos("white", board);
      expect(pos).toBeNull();
    });
  });

  describe("Pawn Movement", () => {
    it("should allow pawn to move forward one square", () => {
      const board = createBoardFromFEN("8/8/8/8/8/8/4P3/8");
      const whitePawn = board[6][4]!;

      const moves = generateMoves(6, 4, whitePawn, board);
      expect(moves).toContainEqual([5, 4]);
    });

    it("should allow pawn to move forward two squares from starting position", () => {
      const board = createBoardFromFEN("8/8/8/8/8/8/4P3/8");
      const whitePawn = board[6][4]!;

      const moves = generateMoves(6, 4, whitePawn, board);
      expect(moves).toContainEqual([4, 4]);
      expect(moves).toContainEqual([5, 4]);
    });

    it("should not allow pawn to move two squares if already moved", () => {
      const board = createBoardFromFEN("8/8/8/8/8/4P3/8/8");
      const whitePawn = board[5][4]!;
      const moves = generateMoves(5, 4, whitePawn, board);
      expect(moves).not.toContainEqual([3, 4]);
    });

    it("should allow pawn to capture diagonally", () => {
      const board = createBoardFromFEN("8/8/8/8/8/3p1p2/4P3/8");
      const whitePawn = board[6][4]!;

      const moves = generateMoves(6, 4, whitePawn, board);
      expect(moves).toContainEqual([5, 3]);
      expect(moves).toContainEqual([5, 5]);
    });

    it("should not allow pawn to move forward if blocked", () => {
      const board = createBoardFromFEN("8/8/8/8/8/4p3/4P3/8");
      const whitePawn = board[6][4]!;

      const moves = generateMoves(6, 4, whitePawn, board);
      expect(moves).not.toContainEqual([5, 4]);
      expect(moves).not.toContainEqual([4, 4]);
    });

    it("should handle en passant capture", () => {
      const board = createBoardFromFEN("8/8/8/4Pp2/8/8/8/8");
      const whitePawn = board[3][4]!;

      const lastMove: [[number, number], [number, number]] = [
        [1, 5],
        [3, 5],
      ];
      const moves = generateMoves(3, 4, whitePawn, board, lastMove);

      expect(moves).toContainEqual([2, 5]);
    });

    it("should stop checkmate with en passant", () => {
      const lastMove: [Position, Position] = [
        [6, 5],
        [4, 5],
      ];
      const board = createBoardFromFEN("8/8/3ppp2/3pkp2/3ppP2/8/PPPPP1PP/5Q2");
      const blackPawn = board[4][4]!;
      const moves = generateMoves(4, 4, blackPawn, board, lastMove);

      expect(moves).toContainEqual([5, 5]);
      expect(isCheckmate("black", board, lastMove)).toBe(false);
    });
  });

  describe("Knight Movement", () => {
    it("should generate all valid knight moves", () => {
      const board = createBoardFromFEN("8/8/8/8/4N3/8/8/8");
      const whiteKnight = board[4][4]!;

      const moves = generateMoves(4, 4, whiteKnight, board);

      const expectedMoves = [
        [6, 5],
        [6, 3],
        [2, 5],
        [2, 3],
        [5, 6],
        [5, 2],
        [3, 6],
        [3, 2],
      ];

      expectedMoves.forEach((move) => {
        expect(moves).toContainEqual(move);
      });
      expect(moves).toHaveLength(8);
    });

    it("should not move knight off board", () => {
      const board = createBoardFromFEN("N7/8/8/8/8/8/8/8");
      const whiteKnight = board[0][0]!;

      const moves = generateMoves(0, 0, whiteKnight, board);
      expect(moves).toHaveLength(2);
      expect(moves).toContainEqual([2, 1]);
      expect(moves).toContainEqual([1, 2]);
    });
  });

  describe("Rook Movement", () => {
    it("should move horizontally and vertically", () => {
      const board = createBoardFromFEN("8/8/8/8/4R3/8/8/8");
      const whiteRook = board[4][4]!;

      const moves = generateMoves(4, 4, whiteRook, board);

      // Should have 14 moves (7 horizontal + 7 vertical)
      expect(moves).toHaveLength(14);
      expect(moves).toContainEqual([4, 0]);
      expect(moves).toContainEqual([4, 7]);
      expect(moves).toContainEqual([0, 4]);
      expect(moves).toContainEqual([7, 4]);
    });

    it("should be blocked by friendly pieces", () => {
      const board = createBoardFromFEN("8/8/8/8/4R1P1/8/8/8");
      const whiteRook = board[4][4]!;

      const moves = generateMoves(4, 4, whiteRook, board);

      expect(moves).toContainEqual([4, 5]);
      expect(moves).not.toContainEqual([4, 6]);
      expect(moves).not.toContainEqual([4, 7]);
    });

    it("should capture enemy pieces but not move past them", () => {
      const board = createBoardFromFEN("8/8/8/8/4R1p1/8/8/8");
      const whiteRook = board[4][4]!;

      const moves = generateMoves(4, 4, whiteRook, board);

      expect(moves).toContainEqual([4, 6]);
      expect(moves).not.toContainEqual([4, 7]);
    });
  });

  describe("Bishop Movement", () => {
    it("should move diagonally", () => {
      const board = createBoardFromFEN("8/8/8/8/4B3/8/8/8");
      const whiteBishop = board[4][4]!;

      const moves = generateMoves(4, 4, whiteBishop, board);

      expect(moves).toHaveLength(13);
      expect(moves).toContainEqual([0, 0]);
      expect(moves).toContainEqual([7, 7]);
      expect(moves).toContainEqual([1, 7]);
      expect(moves).toContainEqual([7, 1]);
    });
  });

  describe("Queen Movement", () => {
    it("should move like rook and bishop combined", () => {
      const board = createBoardFromFEN("8/8/8/8/4Q3/8/8/8");
      const whiteQueen = board[4][4]!;

      const moves = generateMoves(4, 4, whiteQueen, board);

      expect(moves).toHaveLength(27); // 14 rook-like + 13 bishop-like
    });
  });

  describe("King Movement", () => {
    it("should move one square in any direction", () => {
      const board = createBoardFromFEN("8/8/8/8/4K3/8/8/8");
      const whiteKing = board[4][4]!;

      const moves = generateMoves(4, 4, whiteKing, board);

      expect(moves).toHaveLength(8);
      expect(moves).toContainEqual([3, 3]);
      expect(moves).toContainEqual([3, 4]);
      expect(moves).toContainEqual([3, 5]);
      expect(moves).toContainEqual([4, 3]);
      expect(moves).toContainEqual([4, 5]);
      expect(moves).toContainEqual([5, 3]);
      expect(moves).toContainEqual([5, 4]);
      expect(moves).toContainEqual([5, 5]);
    });
  });

  describe("Castling", () => {
    it("should allow kingside castling when conditions are met", () => {
      const board = createBoardFromFEN("8/8/8/8/8/8/8/4K2R");
      const whiteKing = board[7][4]!;

      const moves = generateMoves(7, 4, whiteKing, board);
      expect(moves).toContainEqual([7, 6]);
    });

    it("should allow queenside castling when conditions are met", () => {
      const board = createBoardFromFEN("8/8/8/8/8/8/8/R3K3");
      const whiteKing = board[7][4]!;

      const moves = generateMoves(7, 4, whiteKing, board);
      expect(moves).toContainEqual([7, 2]);
    });

    it("should not allow castling if king has moved", () => {
      const board = createBoardFromFEN("8/8/8/8/8/8/8/8");
      const whiteKing: Piece = { type: "king", color: "white", hasMoved: true };
      const whiteRook: Piece = {
        type: "rook",
        color: "white",
        hasMoved: false,
      };

      board[7][4] = whiteKing;
      board[7][7] = whiteRook;

      const moves = generateMoves(7, 4, whiteKing, board);
      expect(moves).not.toContainEqual([7, 6]);
    });

    it("should not allow castling if rook has moved", () => {
      const board = createBoardFromFEN("8/8/8/8/8/8/8/8");
      const whiteKing: Piece = {
        type: "king",
        color: "white",
        hasMoved: false,
      };
      const whiteRook: Piece = { type: "rook", color: "white", hasMoved: true };

      board[7][4] = whiteKing;
      board[7][7] = whiteRook;

      const moves = generateMoves(7, 4, whiteKing, board);
      expect(moves).not.toContainEqual([7, 6]);
    });

    it("should not allow castling through check", () => {
      const board = createBoardFromFEN("5r2/8/8/8/8/8/8/4K2R");
      const whiteKing = board[7][4]!;

      const moves = generateMoves(7, 4, whiteKing, board);
      expect(moves).not.toContainEqual([7, 6]);
    });

    it("should not allow castling when in check", () => {
      const board = createBoardFromFEN("4r3/8/8/8/8/8/8/4K2R");
      const whiteKing = board[7][4]!;

      const moves = generateMoves(7, 4, whiteKing, board);
      expect(moves).not.toContainEqual([7, 6]);
    });

    it("should not allow castling with pieces in between", () => {
      const board = createBoardFromFEN("8/8/8/8/8/8/8/4K1NR");
      const whiteKing = board[7][4]!;

      const moves = generateMoves(7, 4, whiteKing, board);
      expect(moves).not.toContainEqual([7, 6]);
    });
  });

  describe("Check Detection", () => {
    it("should detect when king is in check from rook", () => {
      const board = createBoardFromFEN("4r3/8/8/8/8/8/8/4K3");

      expect(isInCheck("white", board)).toBe(true);
    });

    it("should detect when king is in check from bishop", () => {
      const board = createBoardFromFEN("8/8/8/8/1b6/8/8/4K3");

      expect(isInCheck("white", board)).toBe(true);
    });

    it("should detect when king is in check from knight", () => {
      const board = createBoardFromFEN("8/8/8/8/8/8/2n5/4K3");

      expect(isInCheck("white", board)).toBe(true);
    });

    it("should detect when king is in check from pawn", () => {
      const board = createBoardFromFEN("8/8/8/8/8/8/3p4/4K3");

      expect(isInCheck("white", board)).toBe(true);
    });

    it("should return false when king is not in check", () => {
      const board = createBoardFromFEN("r7/8/8/8/8/8/8/4K3");

      expect(isInCheck("white", board)).toBe(false);
    });
  });

  describe("Checkmate Detection", () => {
    it("should detect back rank checkmate", () => {
      const board = createBoardFromFEN("1R4k1/5ppp/8/8/8/8/8/8");

      expect(isCheckmate("black", board, null)).toBe(true);
    });

    it("should detect two rook checkmate (ladder mate)", () => {
      const board = createBoardFromFEN("k7/8/1R6/R7/8/8/8/7K");

      expect(isCheckmate("black", board, null)).toBe(true);
    });

    it("should detect queen and king checkmate", () => {
      const board = createBoardFromFEN("7k/5Q2/6K1/8/8/8/8/8");

      expect(isCheckmate("black", board, null)).toBe(true);
    });

    it("should detect smothered checkmate", () => {
      const board = createBoardFromFEN("6rk/5Npp/8/8/8/8/8/8");

      expect(isCheckmate("black", board, null)).toBe(true);
    });

    it("should detect pawn promotion checkmate", () => {
      const board = createBoardFromFEN("P3k3/R7/8/8/8/8/8/8");
      const newBoard = promotePawn(board, 0, 0, "queen");

      expect(isCheckmate("black", newBoard, null)).toBe(true);
    });

    it("should return false when king can escape check", () => {
      const board = createBoardFromFEN("8/8/8/8/8/8/8/4Kr2");

      expect(isCheckmate("white", board, null)).toBe(false);
    });

    it("should return false when check can be blocked", () => {
      const board = createBoardFromFEN("4r3/8/8/8/8/8/2R5/4K3");

      expect(isCheckmate("white", board, null)).toBe(false);
    });

    it("should return false when checking piece can be captured", () => {
      const board = createBoardFromFEN("4r3/8/8/8/8/8/8/3RK3");

      expect(isCheckmate("white", board, null)).toBe(false);
    });
  });

  describe("Stalemate Detection", () => {
    it("should detect stalemate when king has no legal moves but not in check", () => {
      // Classic stalemate position
      const board = createBoardFromFEN("k7/2Q5/1K6/8/8/8/8/8");

      expect(isInCheck("black", board)).toBe(false);
      expect(isStalemate("black", board, null)).toBe(true);
    });

    it("should detect stalemate with king in corner", () => {
      // Move queen to create stalemate
      const stalemateBoard = createBoardFromFEN("7k/5Q2/6K1/8/8/8/8/8");

      expect(isInCheck("black", stalemateBoard)).toBe(false);
      expect(isStalemate("black", stalemateBoard, null)).toBe(true);
    });

    it("should return false when player has legal moves", () => {
      const board = createBoardFromFEN("k7/8/8/8/8/4P3/8/4K3");

      expect(isStalemate("white", board, null)).toBe(false);
    });

    it("should return false when in check (not stalemate)", () => {
      const board = createBoardFromFEN("r6k/8/8/8/8/8/8/7K");

      expect(isStalemate("white", board, null)).toBe(false);
    });
  });

  describe("isSquareUnderAttack", () => {
    it("should detect square under attack by rook", () => {
      const board = createBoardFromFEN("4r3/8/8/8/8/8/8/8");

      expect(isSquareUnderAttack(7, 4, "white", board)).toBe(true);
    });

    it("should detect square under attack by bishop", () => {
      const board = createBoardFromFEN("b7/8/8/8/8/8/8/8");

      expect(isSquareUnderAttack(7, 7, "white", board)).toBe(true);
    });

    it("should detect square under attack by knight", () => {
      const board = createBoardFromFEN("8/8/8/8/4n3/8/8/8");

      expect(isSquareUnderAttack(6, 5, "white", board)).toBe(true);
    });

    it("should return false when square is not under attack", () => {
      const board = createBoardFromFEN("r7/8/8/8/8/8/8/8");

      expect(isSquareUnderAttack(7, 7, "white", board)).toBe(false);
    });
  });

  describe("Pawn Promotion", () => {
    describe("shouldPromote", () => {
      it("should return true when white pawn reaches rank 1 (row 0)", () => {
        const board = createBoardFromFEN("8/8/8/8/8/8/8/4P3");
        const whitePawn = board[7][4]!;

        expect(shouldPromote(whitePawn, 0, "white")).toBe(true);
      });

      it("should return true when black pawn reaches rank 8 (row 7)", () => {
        const board = createBoardFromFEN("4p3/8/8/8/8/8/8/8");
        const blackPawn = board[0][4]!;

        expect(shouldPromote(blackPawn, 7, "black")).toBe(true);
      });

      it("should return false when pawn is not at promotion rank", () => {
        const board = createBoardFromFEN("8/4P3/8/8/8/8/8/8");
        const whitePawn = board[1][4]!;

        expect(shouldPromote(whitePawn, 1, "white")).toBe(false);
      });

      it("should return false for non-pawn pieces", () => {
        const board = createBoardFromFEN("8/8/8/8/8/8/8/4Q3");
        const whiteQueen = board[7][4]!;

        expect(shouldPromote(whiteQueen, 0, "white")).toBe(false);
      });
    });

    describe("promotePawn", () => {
      it("should promote white pawn to queen", () => {
        const board = createBoardFromFEN("4P3/8/8/8/8/8/8/8");
        const newBoard = promotePawn(board, 0, 4, "queen");

        expect(newBoard[0][4]?.type).toBe("queen");
        expect(newBoard[0][4]?.color).toBe("white");
        expect(newBoard[0][4]?.hasMoved).toBe(true);
      });

      it("should promote black pawn to rook", () => {
        const board = createBoardFromFEN("8/8/8/8/8/8/8/4p3");
        const newBoard = promotePawn(board, 7, 4, "rook");

        expect(newBoard[7][4]?.type).toBe("rook");
        expect(newBoard[7][4]?.color).toBe("black");
        expect(newBoard[7][4]?.hasMoved).toBe(true);
      });

      it("should promote to bishop", () => {
        const board = createBoardFromFEN("8/8/8/8/8/8/8/4P3");
        const newBoard = promotePawn(board, 7, 4, "bishop");

        expect(newBoard[7][4]?.type).toBe("bishop");
      });

      it("should promote to knight", () => {
        const board = createBoardFromFEN("8/8/8/8/8/8/8/4P3");
        const newBoard = promotePawn(board, 7, 4, "knight");

        expect(newBoard[7][4]?.type).toBe("knight");
      });

      it("should not modify original board", () => {
        const board = createBoardFromFEN("8/8/8/8/8/8/8/4P3");
        const originalPiece = board[7][4];

        promotePawn(board, 7, 4, "queen");

        expect(board[7][4]).toEqual(originalPiece);
      });

      it("should throw error when promoting non-pawn piece", () => {
        const board = createBoardFromFEN("8/8/8/8/8/8/8/4Q3");

        expect(() => promotePawn(board, 7, 4, "queen")).toThrow(
          "Cannot promote non-pawn piece"
        );
      });

      it("should throw error when promoting empty square", () => {
        const board = createBoardFromFEN("8/8/8/8/8/8/8/8");

        expect(() => promotePawn(board, 7, 4, "queen")).toThrow(
          "Cannot promote non-pawn piece"
        );
      });
    });
  });
});
