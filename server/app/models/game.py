# app/models/game.py
from typing import Optional, List
from enum import Enum
from app.models.board import Board
from app.models.position import Position
from app.models.piece import Color, Piece, PieceType, King, Rook, Pawn

class GameStatus(Enum):
    ACTIVE = "active"
    CHECKMATE = "checkmate"
    STALEMATE = "stalemate"
    DRAW = "draw"

class Move:
    """Represents a chess move"""
    def __init__(
        self, 
        from_pos: Position, 
        to_pos: Position,
        promotion_piece: Optional[PieceType] = None
    ):
        self.from_pos = from_pos
        self.to_pos = to_pos
        self.promotion_piece = promotion_piece
        self.captured_piece: Optional[Piece] = None
        self.is_castling = False
        self.is_en_passant = False
    
    def __str__(self) -> str:
        return f"{self.from_pos} to {self.to_pos}"
    
    def __repr__(self) -> str:
        return f"Move({self.from_pos}, {self.to_pos})"

class Game:
    """Main game class that handles all chess logic"""
    
    def __init__(self):
        self.board = Board()
        self.board.setup_initial_position()
        self.current_turn = Color.WHITE
        self.move_history: List[Move] = []
        self.status = GameStatus.ACTIVE
    
    @property
    def last_move(self) -> Optional[Move]:
        """Get the last move played"""
        return self.move_history[-1] if self.move_history else None
    
    def get_legal_moves(self, position: Position) -> List[Position]:
        """Get all legal moves for the piece at the given position"""
        piece = self.board.get_piece(position)
        if not piece or piece.color != self.current_turn:
            return []
        
        # Get possible moves from the piece
        possible_moves = piece.get_possible_moves(position, self.board)
        
        # Add special moves
        if isinstance(piece, King):
            possible_moves.extend(self._get_castling_moves(position))
        elif isinstance(piece, Pawn):
            possible_moves.extend(self._get_en_passant_moves(position))
        
        # Filter out moves that would leave king in check
        legal_moves = []
        for move_pos in possible_moves:
            if self._is_legal_move(position, move_pos):
                legal_moves.append(move_pos)
        
        return legal_moves
    
    def _is_legal_move(self, from_pos: Position, to_pos: Position) -> bool:
        """Check if a move is legal (doesn't leave king in check)"""
        # Make a temporary board to test the move
        test_board = self.board.clone()
        test_board.move_piece(from_pos, to_pos)
        
        # Handle en passant capture on test board
        piece = self.board.get_piece(from_pos)
        if isinstance(piece, Pawn):
            if abs(to_pos.col - from_pos.col) == 1 and self.board.get_piece(to_pos) is None:
                # En passant - remove the captured pawn
                test_board.set_piece(Position(from_pos.row, to_pos.col), None)
        
        return not test_board.is_in_check(self.current_turn)
    
    def make_move(
        self, 
        from_pos: Position, 
        to_pos: Position,
        promotion_piece: Optional[PieceType] = None
    ) -> bool:
        """
        Make a move. Returns True if successful, False otherwise.
        """
        if self.status != GameStatus.ACTIVE:
            return False
        
        piece = self.board.get_piece(from_pos)
        if not piece or piece.color != self.current_turn:
            return False
        
        legal_moves = self.get_legal_moves(from_pos)
        if to_pos not in legal_moves:
            return False
        
        # Create move object
        move = Move(from_pos, to_pos, promotion_piece)
        
        # Handle special moves
        if isinstance(piece, King) and abs(to_pos.col - from_pos.col) == 2:
            self._perform_castling(from_pos, to_pos)
            move.is_castling = True
        elif isinstance(piece, Pawn) and abs(to_pos.col - from_pos.col) == 1 and self.board.get_piece(to_pos) is None:
            self._perform_en_passant(from_pos, to_pos)
            move.is_en_passant = True
        else:
            # Regular move
            move.captured_piece = self.board.move_piece(from_pos, to_pos)
        
        # Handle pawn promotion
        if isinstance(piece, Pawn):
            promotion_row = 0 if piece.color == Color.WHITE else 7
            if to_pos.row == promotion_row:
                self._promote_pawn(to_pos, promotion_piece or PieceType.QUEEN)
        
        # Add to history
        self.move_history.append(move)
        
        # Switch turns
        self.current_turn = self.current_turn.opposite()
        
        # Update game status
        self._update_game_status()
        
        return True
    
    def _get_castling_moves(self, king_pos: Position) -> List[Position]:
        """Get castling moves for the king"""
        moves = []
        king = self.board.get_piece(king_pos)
        
        if not isinstance(king, King) or king.has_moved:
            return moves
        
        if self.board.is_in_check(self.current_turn):
            return moves
        
        back_rank = 7 if self.current_turn == Color.WHITE else 0
        
        # Kingside castling
        kingside_rook = self.board.get_piece(Position(back_rank, 7))
        if isinstance(kingside_rook, Rook) and not kingside_rook.has_moved:
            if (self.board.get_piece(Position(back_rank, 5)) is None and
                self.board.get_piece(Position(back_rank, 6)) is None):
                if (not self.board.is_square_under_attack(Position(back_rank, 5), self.current_turn.opposite()) and
                    not self.board.is_square_under_attack(Position(back_rank, 6), self.current_turn.opposite())):
                    moves.append(Position(back_rank, 6))
        
        # Queenside castling
        queenside_rook = self.board.get_piece(Position(back_rank, 0))
        if isinstance(queenside_rook, Rook) and not queenside_rook.has_moved:
            if (self.board.get_piece(Position(back_rank, 1)) is None and
                self.board.get_piece(Position(back_rank, 2)) is None and
                self.board.get_piece(Position(back_rank, 3)) is None):
                if (not self.board.is_square_under_attack(Position(back_rank, 2), self.current_turn.opposite()) and
                    not self.board.is_square_under_attack(Position(back_rank, 3), self.current_turn.opposite())):
                    moves.append(Position(back_rank, 2))
        
        return moves
    
    def _perform_castling(self, king_pos: Position, king_target: Position) -> None:
        """Perform castling move"""
        back_rank = king_pos.row
        
        # Move king
        self.board.move_piece(king_pos, king_target)
        
        # Move rook
        if king_target.col == 6:  # Kingside
            rook_from = Position(back_rank, 7)
            rook_to = Position(back_rank, 5)
            self.board.move_piece(rook_from, rook_to)
        else:  # Queenside
            rook_from = Position(back_rank, 0)
            rook_to = Position(back_rank, 3)
            self.board.move_piece(rook_from, rook_to)
    
    def _get_en_passant_moves(self, pawn_pos: Position) -> List[Position]:
        """Get en passant capture moves for a pawn"""
        moves = []
        
        if not self.last_move:
            return moves
        
        pawn = self.board.get_piece(pawn_pos)
        if not isinstance(pawn, Pawn):
            return moves
        
        en_passant_row = 3 if pawn.color == Color.WHITE else 4
        if pawn_pos.row != en_passant_row:
            return moves
        
        # Check if last move was a two-square pawn move next to our pawn
        last_piece = self.board.get_piece(self.last_move.to_pos)
        if (isinstance(last_piece, Pawn) and
            abs(self.last_move.from_pos.row - self.last_move.to_pos.row) == 2 and
            self.last_move.to_pos.row == pawn_pos.row and
            abs(self.last_move.to_pos.col - pawn_pos.col) == 1):
            
            direction = -1 if pawn.color == Color.WHITE else 1
            capture_pos = Position(pawn_pos.row + direction, self.last_move.to_pos.col)
            moves.append(capture_pos)
        
        return moves
    
    def _perform_en_passant(self, from_pos: Position, to_pos: Position) -> None:
        """Perform en passant capture"""
        self.board.move_piece(from_pos, to_pos)
        # Remove the captured pawn
        self.board.set_piece(Position(from_pos.row, to_pos.col), None)
    
    def _promote_pawn(self, position: Position, piece_type: PieceType) -> None:
        """Promote a pawn to another piece"""
        pawn = self.board.get_piece(position)
        if not isinstance(pawn, Pawn):
            return
        
        # Import here to avoid circular imports
        from app.models.piece import Queen, Rook, Bishop, Knight
        
        piece_classes = {
            PieceType.QUEEN: Queen,
            PieceType.ROOK: Rook,
            PieceType.BISHOP: Bishop,
            PieceType.KNIGHT: Knight,
        }
        
        piece_class = piece_classes.get(piece_type, Queen)
        new_piece = piece_class(pawn.color, has_moved=True)
        self.board.set_piece(position, new_piece)
    
    def _update_game_status(self) -> None:
        """Update game status (check for checkmate/stalemate)"""
        # Check if current player has any legal moves
        has_legal_moves = False
        for pos, piece in self.board.get_all_pieces(self.current_turn):
            if self.get_legal_moves(pos):
                has_legal_moves = True
                break
        
        if not has_legal_moves:
            if self.board.is_in_check(self.current_turn):
                self.status = GameStatus.CHECKMATE
            else:
                self.status = GameStatus.STALEMATE
    
    def is_checkmate(self) -> bool:
        """Check if current position is checkmate"""
        return self.status == GameStatus.CHECKMATE
    
    def is_stalemate(self) -> bool:
        """Check if current position is stalemate"""
        return self.status == GameStatus.STALEMATE
    
    def is_check(self) -> bool:
        """Check if current player is in check"""
        return self.board.is_in_check(self.current_turn)
    
    def display(self) -> str:
        """Display the current game state"""
        lines = [self.board.display()]
        lines.append(f"\nCurrent turn: {self.current_turn.value}")
        lines.append(f"Status: {self.status.value}")
        
        if self.is_check():
            lines.append("CHECK!")
        
        return "\n".join(lines)