from pydantic import BaseModel
from typing import Optional, List
from app.models.piece import Color, PieceType

class PositionModel(BaseModel):
    row: int
    col: int

class MoveRequest(BaseModel):
    from_pos: PositionModel
    to_pos: PositionModel
    promotion_piece: Optional[str] = None  # "queen", "rook", etc.

class GameStateResponse(BaseModel):
    board: List[List[Optional[dict]]]  # Serialized pieces
    current_turn: str
    status: str
    is_check: bool
    is_checkmate: bool
    is_stalemate: bool
    
class MoveResponse(BaseModel):
    success: bool
    error: Optional[str] = None
    new_state: Optional[GameStateResponse] = None