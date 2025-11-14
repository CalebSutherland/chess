import { createBoardFromFEN, initialBoard, testBoards } from "../boards";
import type { Board } from "../../types/chess_types";

describe("Boards module", () => {
  it("creates an 8x8 board from FEN with correct piece placement and empties", () => {
    const board: Board = createBoardFromFEN("8/8/8/8/8/8/4P3/8");

    // Ensure dimensions
    expect(board).toHaveLength(8);
    board.forEach((row) => expect(row).toHaveLength(8));

    // Pawn at row 6, col 4
    expect(board[6][4]).toBeDefined();
    expect(board[6][4]?.type).toBe("pawn");
    expect(board[6][4]?.color).toBe("white");

    // Ensure empty square
    expect(board[7][7]).toBeNull();
  });

  it("marks pieces on their starting squares as not moved and others as moved", () => {
    // Standard starting FEN: pawns on row 6 and 1 should be hasMoved=false
    const start = createBoardFromFEN(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
    );

    // white pawn on starting square
    expect(start[6][0]?.type).toBe("pawn");
    expect(start[6][0]?.hasMoved).toBe(false);

    // black pawn on starting square
    expect(start[1][7]?.type).toBe("pawn");
    expect(start[1][7]?.hasMoved).toBe(false);

    // piece not on starting square should be hasMoved=true
    // place a white pawn away from its starting row (row 4)
    const shifted = createBoardFromFEN("8/8/8/8/4P3/8/8/8");
    expect(shifted[4][4]?.hasMoved).toBe(true);
  });

  it("exports an initialBoard that matches the standard starting position", () => {
    // initialBoard should have kings in expected squares and rooks in corners
    expect(initialBoard[7][4]?.type).toBe("king");
    expect(initialBoard[0][4]?.type).toBe("king");
    expect(initialBoard[7][0]?.type).toBe("rook");
    expect(initialBoard[7][7]?.type).toBe("rook");
  });

  it("provides a list of testBoards with names and board instances", () => {
    expect(Array.isArray(testBoards)).toBe(true);
    expect(testBoards.length).toBeGreaterThan(0);
    testBoards.forEach((tb) => {
      expect(tb).toHaveProperty("name");
      expect(tb).toHaveProperty("board");
    });
  });
});
