from typing import List, Optional, Tuple
from copy import deepcopy

from app.models.position import Position
from app.models.piece import (
    Piece, Color, King, Queen, Rook, Bishop, Knight, Pawn
)

class Board():
    """Represents the 8x8 chess board and piece placement."""

    def __init__(self):
        self.grid: List[List[Optional[Piece]]] = [
            [None for _ in range(8)] for _ in range(8)
        ]

    def get_piece(self, pos: Position) -> Optional[Piece]:
        return self.grid[pos.row][pos.col]

    def set_piece(self, pos: Position, piece: Optional[Piece]):
        self.grid[pos.row][pos.col] = piece

    def move_piece(self, from_pos: Position, to_pos: Position) -> Optional[Piece]:
        piece = self.get_piece(from_pos)
        captured = self.get_piece(to_pos)

        self.grid[to_pos.row][to_pos.col] = piece
        self.grid[from_pos.row][from_pos.col] = None

        piece.has_moved = True
        return captured
    
    def clone(self) -> "Board":
        """Deep clone the board so legal-move simulation works."""
        new_board = Board()
        new_board.grid = deepcopy(self.grid)
        return new_board
    
    def get_all_pieces(self, color: Color) -> List[Tuple[Position, Piece]]:
        pieces = []
        for r in range(8):
            for c in range(8):
                piece = self.grid[r][c]
                if piece and piece.color == color:
                    pieces.append((Position(r, c), piece))
        return pieces
    
    def is_square_under_attack(self, pos: Position, attacker_color: Color) -> bool:
        """
        Returns True if 'pos' is attacked by any piece of attacker_color.
        """
        for piece_pos, piece in self.get_all_pieces(attacker_color):
            moves = piece.get_possible_moves(piece_pos, self)
            if pos in moves:
                return True
        return False
    
    def is_in_check(self, color: Color) -> bool:
        """
        Returns True if the king of 'color' is in check.
        """
        # Find king
        king_pos = None
        for pos, piece in self.get_all_pieces(color):
            if isinstance(piece, King):
                king_pos = pos
                break

        if king_pos is None:
            # Should not happen in real games
            return False

        return self.is_square_under_attack(
            king_pos,
            attacker_color=color.opposite()
        )
    
    def setup_initial_position(self):
        """Set up the standard chess starting pieces."""

        # Back ranks
        for color, row_pieces, pawn_row in [
            (Color.WHITE, 7, 6),
            (Color.BLACK, 0, 1),
        ]:
            # Major pieces
            self.grid[row_pieces] = [
                Rook(color),
                Knight(color),
                Bishop(color),
                Queen(color),
                King(color),
                Bishop(color),
                Knight(color),
                Rook(color),
            ]

            # Pawns
            for col in range(8):
                self.grid[pawn_row][col] = Pawn(color)

    def display(self) -> str:
        """Return a text representation of the board."""
        rows = []
        for r in range(8):
            row_str = []
            for c in range(8):
                piece = self.grid[r][c]
                row_str.append(piece.symbol() if piece else ".")
            rows.append(" ".join(row_str))
        return "\n".join(rows)
