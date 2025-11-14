from typing import List, Optional, Tuple, Dict
from copy import deepcopy

from app.models.position import Position
from app.models.piece import (
    Piece, PieceType, Color, King, Queen, Rook, Bishop, Knight, Pawn
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
            if isinstance(piece, Pawn):
                attacks = piece.get_attack_positions(piece_pos, self)
            else:
                attacks = piece.get_possible_moves(piece_pos, self)
            
            if pos in attacks:
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
    
    def check_starting_square(self, piece: Piece, row: int, col: int) -> bool:
        t = piece.piece_type
        c = piece.color

        if t == PieceType.PAWN:
            return (c == Color.WHITE and row == 6) or (c == Color.BLACK and row == 1)

        if t == PieceType.ROOK:
            return (c == Color.WHITE and row == 7 and col in (0, 7)) or \
                (c == Color.BLACK and row == 0 and col in (0, 7))

        if t == PieceType.KNIGHT:
            return (c == Color.WHITE and row == 7 and col in (1, 6)) or \
                (c == Color.BLACK and row == 0 and col in (1, 6))

        if t == PieceType.BISHOP:
            return (c == Color.WHITE and row == 7 and col in (2, 5)) or \
                (c == Color.BLACK and row == 0 and col in (2, 5))

        if t == PieceType.QUEEN:
            return (c == Color.WHITE and row == 7 and col == 3) or \
                (c == Color.BLACK and row == 0 and col == 3)

        if t == PieceType.KING:
            return (c == Color.WHITE and row == 7 and col == 4) or \
                (c == Color.BLACK and row == 0 and col == 4)

        return False
    
    def create_board_from_fen(self, fen: str) -> List[List[Optional[Piece]]]:
        rows = fen.split("/")
        board: List[List[Optional[Piece]]] = [[None for _ in range(8)] for _ in range(8)]

        fen_to_class = {
            "p": Pawn, "r": Rook, "n": Knight, "b": Bishop,
            "q": Queen, "k": King,
            "P": Pawn, "R": Rook, "N": Knight, "B": Bishop,
            "Q": Queen, "K": King,
        }

        fen_to_color = {
            "p": Color.BLACK, "r": Color.BLACK, "n": Color.BLACK,
            "b": Color.BLACK, "q": Color.BLACK, "k": Color.BLACK,
            "P": Color.WHITE, "R": Color.WHITE, "N": Color.WHITE,
            "B": Color.WHITE, "Q": Color.WHITE, "K": Color.WHITE,
        }

        for row_index, row in enumerate(rows):
            col = 0

            for char in row:
                if char.isdigit():
                    col += int(char)
                else:
                    if char not in fen_to_class:
                        raise ValueError(f"Invalid FEN character: {char}")

                    piece_class = fen_to_class[char]
                    color = fen_to_color[char]

                    # create correct subclass instance
                    piece = piece_class(color=color)

                    # set has_moved based on starting square
                    piece.has_moved = not self.check_starting_square(piece, row_index, col)

                    board[row_index][col] = piece
                    col += 1

        return board

    def setup_initial_position(self):
        """Set up the standard chess starting pieces."""
        self.grid = self.create_board_from_fen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")

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
