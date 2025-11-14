import { moveToSAN, historyToSAN, getMovePairs } from "../san";
import { createBoardFromFEN } from "../boards";
import type { GameState } from "../../types/chess_types";

describe("SAN utilities", () => {
  it("formats a pawn advance to algebraic (e4)", () => {
    const prevBoard = createBoardFromFEN(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
    );
    const currentBoard = createBoardFromFEN(
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR"
    );

    const prevState: GameState = {
      board: prevBoard,
      lastMove: null,
      currentTurn: "white",
      inCheck: null,
      checkMate: false,
      stalemate: false,
    };

    const currentState: GameState = {
      board: currentBoard,
      lastMove: [
        [6, 4],
        [4, 4],
      ], // e2 -> e4
      currentTurn: "black",
      inCheck: null,
      checkMate: false,
      stalemate: false,
    };

    expect(moveToSAN(prevState, currentState)).toBe("e4");
  });

  it("formats a pawn capture with file disambiguation (dxe6)", () => {
    const prevBoard = createBoardFromFEN("8/8/4p3/3P4/8/8/8/8");
    const currentBoard = createBoardFromFEN("8/8/3P4/8/8/8/8/8");

    const prevState: GameState = {
      board: prevBoard,
      lastMove: null,
      currentTurn: "white",
      inCheck: null,
      checkMate: false,
      stalemate: false,
    };

    const currentState: GameState = {
      board: currentBoard,
      lastMove: [
        [3, 3],
        [2, 4],
      ], // d5 -> e6
      currentTurn: "black",
      inCheck: null,
      checkMate: false,
      stalemate: false,
    };

    expect(moveToSAN(prevState, currentState)).toBe("dxe6");
  });

  it("formats kingside castling as O-O", () => {
    const prevBoard = createBoardFromFEN("8/8/8/8/8/8/8/4K2R");
    const currentBoard = createBoardFromFEN("8/8/8/8/8/8/8/5KR1");

    const prevState: GameState = {
      board: prevBoard,
      lastMove: null,
      currentTurn: "white",
      inCheck: null,
      checkMate: false,
      stalemate: false,
    };

    const currentState: GameState = {
      board: currentBoard,
      lastMove: [
        [7, 4],
        [7, 6],
      ], // e1 -> g1
      currentTurn: "black",
      inCheck: null,
      checkMate: false,
      stalemate: false,
    };

    expect(moveToSAN(prevState, currentState)).toBe("O-O");
  });

  it("formats pawn promotion with =Q", () => {
    const prevBoard = createBoardFromFEN("8/4P3/8/8/8/8/8/4K3");
    const currentBoard = createBoardFromFEN("4Q3/8/8/8/8/8/8/4K3");

    const prevState: GameState = {
      board: prevBoard,
      lastMove: null,
      currentTurn: "white",
      inCheck: null,
      checkMate: false,
      stalemate: false,
    };

    const currentState: GameState = {
      board: currentBoard,
      lastMove: [
        [1, 4],
        [0, 4],
      ], // e7 -> e8
      currentTurn: "black",
      inCheck: null,
      checkMate: false,
      stalemate: false,
    };

    expect(moveToSAN(prevState, currentState)).toBe("e8=Q");
  });

  it("converts a short history to SAN array and pairs", () => {
    const start = createBoardFromFEN(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
    );
    const afterE4 = createBoardFromFEN(
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR"
    );
    const afterE5 = createBoardFromFEN(
      "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR"
    );

    const history: GameState[] = [
      {
        board: start,
        lastMove: null,
        currentTurn: "white",
        inCheck: null,
        checkMate: false,
        stalemate: false,
      },
      {
        board: afterE4,
        lastMove: [
          [6, 4],
          [4, 4],
        ],
        currentTurn: "black",
        inCheck: null,
        checkMate: false,
        stalemate: false,
      },
      {
        board: afterE5,
        lastMove: [
          [1, 4],
          [3, 4],
        ],
        currentTurn: "white",
        inCheck: null,
        checkMate: false,
        stalemate: false,
      },
    ];

    const san = historyToSAN(history);
    expect(san).toEqual(["e4", "e5"]);

    const pairs = getMovePairs(history);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toMatchObject({ moveNumber: 1, white: "e4", black: "e5" });
  });

  it("disambiguates when multiple same-type pieces attack the same square (Ncxd4)", () => {
    const prevBoard = createBoardFromFEN("8/8/2N5/5N2/3p4/8/8/8");
    const currentBoard = createBoardFromFEN("8/8/8/5N2/3N4/8/8/8");

    const prevState: GameState = {
      board: prevBoard,
      lastMove: null,
      currentTurn: "white",
      inCheck: null,
      checkMate: false,
      stalemate: false,
    };

    const currentState: GameState = {
      board: currentBoard,
      lastMove: [
        [2, 2],
        [4, 3],
      ], // c6 -> d4
      currentTurn: "black",
      inCheck: null,
      checkMate: false,
      stalemate: false,
    };

    expect(moveToSAN(prevState, currentState)).toBe("Ncxd4");
  });

  it("appends # when the move results in checkmate", () => {
    const prevBoard = createBoardFromFEN(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
    );
    const currentBoard = createBoardFromFEN(
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR"
    );

    const prevState: GameState = {
      board: prevBoard,
      lastMove: null,
      currentTurn: "white",
      inCheck: null,
      checkMate: false,
      stalemate: false,
    };

    const currentState: GameState = {
      board: currentBoard,
      lastMove: [
        [6, 4],
        [4, 4],
      ], // e2 -> e4
      currentTurn: "black",
      inCheck: null,
      checkMate: true,
      stalemate: false,
    };

    expect(moveToSAN(prevState, currentState)).toBe("e4#");
  });
});
