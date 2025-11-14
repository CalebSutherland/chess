import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.api.models import MoveRequest
from app.models.position import Position
from app.models.piece import (Piece, PieceType)
from app.models.game import Game
from app.models.board import Board

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("chess")

app = FastAPI(title="Chess Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

game = Game()

def serialize_board(board: Board):
    """Convert board to JSON-serializable format"""
    board_data = []
    for row in range(8):
        row_data = []
        for col in range(8):
            pos = Position(row, col)
            piece = board.get_piece(pos)
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
def root():
    return {"message": "Chess Backend API"}

@app.get("/board")
def read_board():
    board = Board("r1bqk2r/ppp2ppp/2nbpn2/3p4/3P1B2/2P1PN2/PP3PPP/RN1QKB1R")
    data = serialize_board(board)
    return {"board_data": data}

@app.post("/move")
def make_move(req: MoveRequest):
    logger.info("Received move: %s -> %s", req.from_pos, req.to_pos)
    logger.info("Board BEFORE move:")
    logger.info("\n" + game.display())
    

    from_pos = Position(req.from_pos.row, req.from_pos.col)
    to_pos = Position(req.to_pos.row, req.to_pos.col)

    promotion = None
    if req.promotion_piece:
        try:
            promotion = PieceType(req.promotion_piece)
        except ValueError:
            logger.error("Invalid promotion piece: %s", req.promotion_piece)
            raise HTTPException(status_code=400, detail="Invalid promotion piece")
        
    success = game.make_move(from_pos, to_pos, promotion)

    if not success:
        logger.warning("Illegal move attempted: %s -> %s", from_pos, to_pos)
        raise HTTPException(status_code=400, detail="Illegal move")
    
    logger.info("Board AFTER move:")
    logger.info("\n" + game.display())
    
    return {
        "ok": True,
        "board": serialize_board(game.board),
        "current_turn": game.current_turn,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)