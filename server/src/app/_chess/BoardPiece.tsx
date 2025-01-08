/* -------------------------------------------------------------------------- */
/*                      BoardPiece Component (Draggable)                      */
/* -------------------------------------------------------------------------- */

import { Piece } from "@/utils/chess/GetPiece";

import { GetPiece } from "@/utils/chess/GetPiece";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

type BoardPieceProps = {
  piece: number;
  pos: number; // 0..63
  onClick?: () => void;
};

export function BoardPiece({ piece, pos, onClick }: BoardPieceProps) {
  const pieceDetails = GetPiece(piece);
  if (pieceDetails.type === Piece.NONE) {
    return <div className="w-full h-full" onClick={onClick} />;
  }

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `${pos}-${piece}`,
      data: {
        piece,
        col: pos % 8,
        row: Math.floor(pos / 8),
      },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 35 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className="w-full h-full p-[1px] relative"
      onClick={onClick}
    >
      <img
        className="w-full h-full"
        src={pieceDetails.pieceImage}
        alt={`${pieceDetails.colorName} ${pieceDetails.typeName}`}
      />
    </div>
  );
}
