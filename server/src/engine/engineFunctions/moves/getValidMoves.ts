"use server";

import { boardToFen } from "@/utils/chess/BoardFromFen";
import { getMoves, position } from "../engineOperations";
import { Piece } from "@/utils/chess/GetPiece";

class Move {
  public from: { x: number; y: number } = { x: 0, y: 0 };
  public to: { x: number; y: number } = { x: 0, y: 0 };
  public promotion: number | null = null;

  constructor(
    from: { x: number; y: number } | number,
    to: { x: number; y: number } | number,
    promotion: number | null = null
  ) {
    if (typeof from === "number") {
      this.from = { x: from % 8, y: Math.floor(from / 8) };
    }
    if (typeof to === "number") {
      this.to = { x: to % 8, y: Math.floor(to / 8) };
    }

    if (typeof from === "object") {
      this.from = from;
    }
    if (typeof to === "object") {
      this.to = to;
    }

    if (typeof promotion === "number") {
      this.promotion = promotion;
    }
  }

  // Computed property for pos
  get pos() {
    return this.from.x + this.from.y * 8;
  }

  obj() {
    return {
      from: this.from,
      to: this.to,
      promotion: this.promotion,
    };
  }

  static fromUci(uci: string): Move {
    return new Move(
      { x: uci.charCodeAt(0) - 97, y: parseInt(uci[1]) - 1 },
      { x: uci.charCodeAt(2) - 97, y: parseInt(uci[3]) - 1 },
      getPromotion(uci)
    );
  }
}

function getPromotion(uci: string): number | null {
  if (uci.length === 5) {
    switch (uci[4]) {
      case "q":
        return Piece.QUEEN;
      case "r":
        return Piece.ROOK;
      case "b":
        return Piece.BISHOP;
      case "n":
        return Piece.KNIGHT;
    }
  }
  return null;
}

export type MoveObj = ReturnType<Move["obj"]>;

export async function getValidMoves(fen: string): Promise<MoveObj[]> {
  await position(fen);
  const uciMoveString = await getMoves();

  if (!uciMoveString) return [];

  const uciMoves: string[] = uciMoveString.split(" ");
  return uciMoves.map((uci) => Move.fromUci(uci).obj());
}

export async function getMoveFromUci(uci: string): Promise<MoveObj> {
  return Move.fromUci(uci).obj();
}
