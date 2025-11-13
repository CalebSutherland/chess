# app/main.py
from app.models.game import Game
from app.models.position import Position
from app.models.piece import PieceType

def play_demo_game():
    """Demo game showing the chess engine in action"""
    game = Game()
    
    print("=== Chess Game Demo ===\n")
    print(game.display())
    print("\n" + "="*40 + "\n")
    
    # Famous Scholar's Mate sequence
    moves = [
        ("e2", "e4"),   # 1. e4
        ("e7", "e5"),   # 1... e5
        ("f1", "c4"),   # 2. Bc4
        ("b8", "c6"),   # 2... Nc6
        ("d1", "h5"),   # 3. Qh5
        ("g8", "f6"),   # 3... Nf6
        ("h5", "f7"),   # 4. Qxf7# (Checkmate!)
    ]
    
    for i, (from_sq, to_sq) in enumerate(moves):
        from_pos = Position.from_algebraic(from_sq)
        to_pos = Position.from_algebraic(to_sq)
        
        print(f"Move {i+1}: {from_sq} -> {to_sq}")
        
        # Show legal moves for the piece
        legal_moves = game.get_legal_moves(from_pos)
        print(f"Legal moves for {from_sq}: {[str(m) for m in legal_moves]}")
        
        success = game.make_move(from_pos, to_pos)
        
        if success:
            print(game.display())
            print()
            
            if game.is_checkmate():
                winner = "White" if game.current_turn.value == "black" else "Black"
                print(f"CHECKMATE! {winner} wins!")
                break
            elif game.is_stalemate():
                print("STALEMATE! It's a draw.")
                break
        else:
            print(f"Illegal move!")
            break
        
        print("="*40 + "\n")

def interactive_mode():
    """Interactive mode where you can play moves"""
    game = Game()
    
    print("=== Interactive Chess ===")
    print("Enter moves in format: e2 e4")
    print("Type 'quit' to exit\n")
    
    while game.status.value == "active":
        print(game.display())
        print()
        
        # Get user input
        user_input = input(f"{game.current_turn.value.capitalize()}'s move: ").strip().lower()
        
        if user_input == 'quit':
            break
        
        try:
            parts = user_input.split()
            if len(parts) < 2:
                print("Invalid format. Use: e2 e4")
                continue
            
            from_sq = parts[0]
            to_sq = parts[1]
            promotion = parts[2] if len(parts) > 2 else None
            
            from_pos = Position.from_algebraic(from_sq)
            to_pos = Position.from_algebraic(to_sq)
            
            # Show legal moves
            legal_moves = game.get_legal_moves(from_pos)
            if legal_moves:
                print(f"Legal moves: {[str(m) for m in legal_moves]}")
            
            # Convert promotion string to PieceType
            promotion_piece = None
            if promotion:
                promotion_map = {
                    'q': PieceType.QUEEN,
                    'r': PieceType.ROOK,
                    'b': PieceType.BISHOP,
                    'n': PieceType.KNIGHT,
                }
                promotion_piece = promotion_map.get(promotion)
            
            success = game.make_move(from_pos, to_pos, promotion_piece)
            
            if not success:
                print("Illegal move! Try again.")
            
        except Exception as e:
            print(f"Error: {e}")
            continue
    
    print("\n" + game.display())
    
    if game.is_checkmate():
        winner = "White" if game.current_turn.value == "black" else "Black"
        print(f"\nCHECKMATE! {winner} wins!")
    elif game.is_stalemate():
        print("\nSTALEMATE! It's a draw.")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "interactive":
        interactive_mode()
    else:
        play_demo_game()