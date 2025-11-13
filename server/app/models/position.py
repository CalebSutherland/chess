from dataclasses import dataclass

@dataclass(frozen=True)
class Position:
    """Represents a position on the chess board (row, col)"""
    row: int
    col: int
    
    def to_algebraic(self) -> str:
        """Convert to chess notation (e.g., e4)"""
        file = chr(ord('a') + self.col)
        rank = str(8 - self.row)
        return f"{file}{rank}"
    
    @classmethod
    def from_algebraic(cls, algebraic: str) -> 'Position':
        """Create Position from chess notation (e.g., 'e4')"""
        if len(algebraic) != 2:
            raise ValueError(f"Invalid algebraic notation: {algebraic}")
        
        col = ord(algebraic[0].lower()) - ord('a')
        row = 8 - int(algebraic[1])
        return cls(row, col)
    
    def is_valid(self) -> bool:
        """Check if position is within board bounds"""
        return 0 <= self.row < 8 and 0 <= self.col < 8
    
    def offset(self, row_delta: int, col_delta: int) -> 'Position':
        """Get a new position offset by the given deltas"""
        return Position(self.row + row_delta, self.col + col_delta)
    
    def __str__(self) -> str:
        return self.to_algebraic()
    
    def __repr__(self) -> str:
        return f"Position({self.row}, {self.col})"