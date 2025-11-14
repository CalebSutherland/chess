from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models.position import Position
from app.models.piece import PieceType
from app.models.game import Game
from app.models.board import Board

app = FastAPI(title="Chess Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def serialize_board(game: Game):
    """Convert board to JSON-serializable format"""
    board_data = []
    for row in range(8):
        row_data = []
        for col in range(8):
            pos = Position(row, col)
            piece = game.board.get_piece(pos)
            if piece:
                row_data.append({
                    "type": piece.piece_type.value,
                    "color": piece.color.value,
                    "has_moved": piece.has_moved
                })
            else:
                row_data.append(None)
        board_data.append(row_data)
    return board_data

@app.get("/")
async def root():
    return {"message": "Chess Backend API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)