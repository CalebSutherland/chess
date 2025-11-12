import type { Board, Color, PieceType } from "../types/chess_types";

const fenToPiece: Record<string, { type: PieceType; color: Color }> = {
  p: { type: "pawn", color: "black" },
  r: { type: "rook", color: "black" },
  n: { type: "knight", color: "black" },
  b: { type: "bishop", color: "black" },
  q: { type: "queen", color: "black" },
  k: { type: "king", color: "black" },
  P: { type: "pawn", color: "white" },
  R: { type: "rook", color: "white" },
  N: { type: "knight", color: "white" },
  B: { type: "bishop", color: "white" },
  Q: { type: "queen", color: "white" },
  K: { type: "king", color: "white" },
};

// assumes pieces on starting squares have not moved
// you can update the hasMoved property by doing board[row][col] = {...board[row][col], hasMoved: true}
export const createBoardFromFEN = (fen: string): Board => {
  const rows = fen.split("/");
  const board: Board = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  rows.forEach((row, rowIndex) => {
    let col = 0;
    for (const char of row) {
      if (/[1-8]/.test(char)) {
        col += parseInt(char, 10);
      } else {
        const pieceInfo = fenToPiece[char];
        if (pieceInfo) {
          const piece = { ...pieceInfo, hasMoved: true };

          // Check if it’s on its starting square
          const isStartingSquare = checkStartingSquare(piece, rowIndex, col);
          piece.hasMoved = !isStartingSquare;

          board[rowIndex][col] = piece;
          col++;
        }
      }
    }
  });

  return board;
};

const checkStartingSquare = (
  piece: { type: PieceType; color: Color },
  row: number,
  col: number
) => {
  const { type, color } = piece;

  if (color === "white") {
    if (type === "pawn") return row === 6;
    if (type === "rook") return row === 7 && (col === 0 || col === 7);
    if (type === "knight") return row === 7 && (col === 1 || col === 6);
    if (type === "bishop") return row === 7 && (col === 2 || col === 5);
    if (type === "queen") return row === 7 && col === 3;
    if (type === "king") return row === 7 && col === 4;
  } else {
    if (type === "pawn") return row === 1;
    if (type === "rook") return row === 0 && (col === 0 || col === 7);
    if (type === "knight") return row === 0 && (col === 1 || col === 6);
    if (type === "bishop") return row === 0 && (col === 2 || col === 5);
    if (type === "queen") return row === 0 && col === 3;
    if (type === "king") return row === 0 && col === 4;
  }

  return false;
};

export const initialBoard = createBoardFromFEN(
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
);

export const testBoards = [
  {
    name: "starting board",
    board: initialBoard,
  },
  {
    name: "test board",
    board: createBoardFromFEN("7k/5Q2/6K1/8/8/8/8/8"),
  },
  {
    name: "checkamte test",
    board: createBoardFromFEN("8/8/8/8/8/8/r6r/4K3"),
  },
  {
    name: "pin test",
    board: createBoardFromFEN("8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8"),
  },
  {
    name: "stalemate test",
    board: createBoardFromFEN("k7/P7/3p4/K2P4/8/8/8/8"),
  },
  {
    name: "en passant test",
    board: createBoardFromFEN("8/8/3ppp2/3pkp2/3pp3/8/PPPPPPPP/5Q2"),
  },
];
