/* -------------------------------------------------------------------------- */
/*                       PromotionWindow Component                            */
/* -------------------------------------------------------------------------- */

import { GetPiece } from "@/utils/chess/GetPiece";

import { MoveObj } from "@/engine/engineFunctions/moves/getValidMoves";
import { Piece } from "@/utils/chess/GetPiece";
import { serverLog } from "@/utils/debug/serverLog";

type PromotionWindowProps = {
  promotionMove: MoveObj;
  turn: number;
  setPromotionMove: (move: MoveObj) => void;
};

export default function PromotionWindow({
  promotionMove,
  turn,
  setPromotionMove,
}: PromotionWindowProps) {
  return (
    <div className="absolute bg-[#5a4136] drop-shadow-md z-50 w-68 h-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 flex">
      {[Piece.QUEEN, Piece.ROOK, Piece.BISHOP, Piece.KNIGHT].map(
        (pieceType) => (
          <div
            key={pieceType}
            onClick={async () => {
              const newMove = {
                ...promotionMove,
                promotion: pieceType,
              };
              await serverLog("Setting promotion move", newMove);
              setPromotionMove(newMove);
            }}
            className={`w-16 h-16 cursor-pointer ${
              pieceType % 2 === 1 ? "bg-[#ecd5bd]" : "bg-[#a77964]"
            }`}
          >
            <img
              src={GetPiece(pieceType | turn).pieceImage}
              alt={`${GetPiece(pieceType | turn).colorName} ${
                GetPiece(pieceType | turn).typeName
              }`}
              className="w-full h-full"
            />
          </div>
        )
      )}
    </div>
  );
}
