type Move = {
  from_pos: { row: number; col: number };
  to_pos: { row: number; col: number };
  promotionPiece?: string;
};

export async function getPing() {
  const res = await fetch("http://localhost:8000/");
  if (!res.ok) throw new Error("Failed to get ping");
  const data = res.json();
  return data;
}

export async function getBoard() {
  const res = await fetch("http://localhost:8000/board");
  if (!res.ok) throw new Error("Failed to get ping");
  const data = res.json();
  return data;
}

export async function postMove(move: Move) {
  const res = await fetch("http://localhost:8000/move", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from_pos: move.from_pos,
      to_pos: move.to_pos,
      promotion_piece: move.promotionPiece ?? null,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err || "Move failed");
  }

  return await res.json();
}
