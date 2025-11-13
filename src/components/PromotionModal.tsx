import { pieceIcons } from "../assets/pieces";
import type { Color, PieceType } from "../types/chess_types";

interface PromotionModalProps {
  color: Color;
  handlePromotion: (pieceType: PieceType) => void;
}
export default function PromotionModal({
  color,
  handlePromotion,
}: PromotionModalProps) {
  const promotionPieces: PieceType[] = ["queen", "rook", "bishop", "knight"];
  return (
    <div className="promotion-overlay">
      <div className="promotion-choices">
        {promotionPieces.map((piece) => (
          <button onClick={() => handlePromotion(piece)}>
            <img src={pieceIcons[piece][color]} />
          </button>
        ))}
      </div>
    </div>
  );
}
