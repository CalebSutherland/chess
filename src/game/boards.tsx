import type { Board } from "../types/chess_types";

export const initialBoard: Board = [
  [
    { type: "rook", color: "black", hasMoved: false },
    { type: "knight", color: "black", hasMoved: false },
    { type: "bishop", color: "black", hasMoved: false },
    { type: "queen", color: "black", hasMoved: false },
    { type: "king", color: "black", hasMoved: false },
    { type: "bishop", color: "black", hasMoved: false },
    { type: "knight", color: "black", hasMoved: false },
    { type: "rook", color: "black", hasMoved: false },
  ],
  Array(8)
    .fill(null)
    .map(() => ({ type: "pawn", color: "black" })),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8)
    .fill(null)
    .map(() => ({ type: "pawn", color: "white" })),
  [
    { type: "rook", color: "white", hasMoved: false },
    { type: "knight", color: "white", hasMoved: false },
    { type: "bishop", color: "white", hasMoved: false },
    { type: "queen", color: "white", hasMoved: false },
    { type: "king", color: "white", hasMoved: false },
    { type: "bishop", color: "white", hasMoved: false },
    { type: "knight", color: "white", hasMoved: false },
    { type: "rook", color: "white", hasMoved: false },
  ],
];

export const testBoard = [
  Array(8).fill(null),
  [null, null, { type: "pawn", color: "black" }, null, null, null, null, null],
  [null, null, null, { type: "pawn", color: "black" }, null, null, null, null],
  [
    { type: "king", color: "white" },
    { type: "pawn", color: "white" },
    null,
    null,
    null,
    null,
    null,
    { type: "rook", color: "black" },
  ],
  [
    null,
    { type: "rook", color: "white" },
    null,
    null,
    null,
    { type: "pawn", color: "black" },
    null,
    { type: "king", color: "black" },
  ],
  Array(8).fill(null),

  [
    null,
    null,
    null,
    null,
    { type: "pawn", color: "white" },
    null,
    { type: "pawn", color: "white" },
    null,
  ],

  Array(8).fill(null),
];

export const stalemateTest = [
  Array(8).fill(null),
  [{ type: "king", color: "black" }, null, null, null, null, null, null, null],
  [{ type: "pawn", color: "white" }, null, null, null, null, null, null, null],
  [{ type: "king", color: "white" }, null, null, null, null, null, null, null],
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
];
