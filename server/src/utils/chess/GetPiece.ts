export const Piece = {
  NONE: 0,
  PAWN: 1,
  KNIGHT: 2,
  BISHOP: 3,
  ROOK: 4,
  QUEEN: 5,
  KING: 6,

  WHITE: 8,
  BLACK: 16,
} as const;

export type PieceColor = typeof Piece.WHITE | typeof Piece.BLACK;
export type PieceType = Omit<(typeof Piece)[keyof typeof Piece], 8 | 16>;

export type PieceDetails = {
  type: Omit<(typeof Piece)[keyof typeof Piece], 8 | 16>;
  color: typeof Piece.WHITE | typeof Piece.BLACK | typeof Piece.NONE;
};

type GetPieceReturn = PieceDetails & {
  typeName: keyof Omit<typeof Piece, "WHITE" | "BLACK">;
  colorName: "WHITE" | "BLACK";
  pieceImage: string;
};

const PieceImages = {
  [Piece.PAWN | Piece.WHITE]: "/pieces/white-pawn.svg",
  [Piece.KNIGHT | Piece.WHITE]: "/pieces/white-knight.svg",
  [Piece.BISHOP | Piece.WHITE]: "/pieces/white-bishop.svg",
  [Piece.ROOK | Piece.WHITE]: "/pieces/white-rook.svg",
  [Piece.QUEEN | Piece.WHITE]: "/pieces/white-queen.svg",
  [Piece.KING | Piece.WHITE]: "/pieces/white-king.svg",

  [Piece.PAWN | Piece.BLACK]: "/pieces/black-pawn.svg",
  [Piece.KNIGHT | Piece.BLACK]: "/pieces/black-knight.svg",
  [Piece.BISHOP | Piece.BLACK]: "/pieces/black-bishop.svg",
  [Piece.ROOK | Piece.BLACK]: "/pieces/black-rook.svg",
  [Piece.QUEEN | Piece.BLACK]: "/pieces/black-queen.svg",
  [Piece.KING | Piece.BLACK]: "/pieces/black-king.svg",
};

export function GetPiece(piece: number): GetPieceReturn {
  const type = piece & 0b111;
  const color = piece & 0b11000;

  if (color !== Piece.WHITE && color !== Piece.BLACK && color !== Piece.NONE) {
    throw new Error("Invalid color");
  }

  if (type === 7) {
    throw new Error("Invalid type");
  }

  let typeName = Object.keys(Piece).find(
    (key) => Piece[key as keyof typeof Piece] === type
  ) as keyof Omit<typeof Piece, "WHITE" | "BLACK">;

  let colorName = Object.keys(Piece).find(
    (key) => Piece[key as keyof typeof Piece] === color
  ) as "WHITE" | "BLACK";

  let pieceImage = PieceImages[piece];

  return {
    type,
    color,
    typeName,
    colorName,
    pieceImage,
  };
}
