from __future__ import annotations
from enum import Enum
from dataclasses import dataclass
from typing import List, Optional
from app.models.position import Position

class Color(Enum):
    WHITE = "white"
    BLACK = "black"

    def opposite(self) -> "Color":
        return Color.BLACK if self == Color.WHITE else Color.WHITE
    
class PieceType(Enum):
    PAWN = "pawn"
    ROOK = "rook"
    KNIGHT = "knight"
    BISHOP = "bishop"
    QUEEN = "queen"
    KING = "king"

class Piece:
    """Base class for all chess pieces."""
    piece_type: PieceType = None

    def __init__(self, color: Color, has_moved: bool = False):
        self.color = color
        self.has_moved = has_moved

    def symbol(self) -> str:
        """Override in subclasses."""
        raise NotImplementedError

    def get_possible_moves(self, pos: Position, board) -> List[Position]:
        """Override in subclasses."""
        raise NotImplementedError

    # Helpers for sliding pieces like bishop/rook/queen
    def _slide(self, pos: Position, board, directions) -> List[Position]:
        moves = []
        for dr, dc in directions:
            r, c = pos.row, pos.col
            while True:
                r += dr
                c += dc
                if not (0 <= r < 8 and 0 <= c < 8):
                    break
                new_pos = Position(r, c)
                piece = board.get_piece(new_pos)
                if piece is None:
                    moves.append(new_pos)
                else:
                    if piece.color != self.color:
                        moves.append(new_pos)
                    break
        return moves
    
class King(Piece):
    piece_type = PieceType.KING

    def symbol(self) -> str:
        return "K" if self.color == Color.WHITE else "k"

    def get_possible_moves(self, pos: Position, board) -> List[Position]:
        directions = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1),]
        moves = []
        for dr, dc in directions:
            r, c = pos.row + dr, pos.col + dc
            if 0 <= r < 8 and 0 <= c < 8:
                new_pos = Position(r, c)
                piece = board.get_piece(new_pos)
                if piece is None or piece.color != self.color:
                    moves.append(new_pos)

        return moves
    
class Queen(Piece):
    piece_type = PieceType.QUEEN

    def symbol(self) -> str:
        return "Q" if self.color == Color.WHITE else "q"

    def get_possible_moves(self, pos: Position, board) -> List[Position]:
        directions = [
            (-1, 0), (1, 0), (0, -1), (0, 1),      # Rook-like
            (-1, -1), (-1, 1), (1, -1), (1, 1),    # Bishop-like
        ]
        return self._slide(pos, board, directions)
    
class Rook(Piece):
    piece_type = PieceType.ROOK

    def symbol(self) -> str:
        return "R" if self.color == Color.WHITE else "r"

    def get_possible_moves(self, pos: Position, board) -> List[Position]:
        directions = [
            (-1, 0), (1, 0),
            (0, -1), (0, 1)
        ]
        return self._slide(pos, board, directions)


class Bishop(Piece):
    piece_type = PieceType.BISHOP

    def symbol(self) -> str:
        return "B" if self.color == Color.WHITE else "b"

    def get_possible_moves(self, pos: Position, board) -> List[Position]:
        directions = [
            (-1, -1), (-1, 1),
            (1, -1), (1, 1)
        ]
        return self._slide(pos, board, directions)
    
class Knight(Piece):
    piece_type = PieceType.KNIGHT

    def symbol(self) -> str:
        return "N" if self.color == Color.WHITE else "n"

    def get_possible_moves(self, pos: Position, board) -> List[Position]:
        moves = []
        offsets = [
            (-2, -1), (-2, 1),
            (-1, -2), (-1, 2),
            (1, -2),  (1, 2),
            (2, -1),  (2, 1)
        ]

        for dr, dc in offsets:
            r, c = pos.row + dr, pos.col + dc
            if 0 <= r < 8 and 0 <= c < 8:
                new_pos = Position(r, c)
                piece = board.get_piece(new_pos)
                if piece is None or piece.color != self.color:
                    moves.append(new_pos)

        return moves
    
class Pawn(Piece):
    piece_type = PieceType.PAWN

    def symbol(self) -> str:
        return "P" if self.color == Color.WHITE else "p"

    def get_possible_moves(self, pos: Position, board) -> List[Position]:
        moves = []
        direction = -1 if self.color == Color.WHITE else 1

        # One step forward
        one = Position(pos.row + direction, pos.col)
        if one.is_valid() and board.get_piece(one) is None:
            moves.append(one)

            # Two steps (only if first move)
            if not self.has_moved:
                two = Position(pos.row + 2 * direction, pos.col)
                if two.is_valid() and board.get_piece(two) is None:
                    moves.append(two)

        # Captures
        for dc in (-1, 1):
            diag = Position(pos.row + direction, pos.col + dc)
            if diag.is_valid():
                piece = board.get_piece(diag)
                if piece and piece.color != self.color:
                    moves.append(diag)

        return moves