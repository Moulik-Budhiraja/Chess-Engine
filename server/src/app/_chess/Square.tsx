/* -------------------------------------------------------------------------- */
/*                         Square Component                                   */
/* -------------------------------------------------------------------------- */

import { MoveObj } from "@/engine/engineFunctions/moves/getValidMoves";
import { Piece } from "@/utils/chess/GetPiece";
import { useDroppable } from "@dnd-kit/core";

type SquareProps = {
  col: number;
  row: number;
  children?: React.ReactNode;
  validMoves: MoveObj[];
  selectedPos: number | null;
  piece: number;
  lastMove: MoveObj | null;
  clickMoveHandler?: (move: MoveObj) => void;
};

export function Square({
  col,
  row,
  children,
  validMoves,
  selectedPos,
  piece,
  lastMove,
  clickMoveHandler,
}: SquareProps) {
  const { setNodeRef } = useDroppable({
    id: `${row}-${col}`,
    data: {
      index: row * 8 + col,
      row,
      col,
    },
  });

  // Is this square highlighted because it was part of the last move or is currently selected?
  const highlightPos =
    row * 8 + col === selectedPos ||
    (lastMove &&
      ((lastMove.to.x === col && lastMove.to.y === row) ||
        (lastMove.from.x === col && lastMove.from.y === row)));

  // Is this square a valid move target for the selected piece?
  const isValidMove =
    selectedPos !== null &&
    validMoves.some(
      (move) =>
        move.to.x === col &&
        move.to.y === row &&
        move.from.x === selectedPos % 8 &&
        move.from.y === Math.floor(selectedPos / 8)
    );

  // The MoveObj if this square can be moved to by the selected piece
  const foundMove = isValidMove
    ? validMoves.find(
        (move) =>
          move.from.x === selectedPos % 8 &&
          move.from.y === Math.floor(selectedPos / 8) &&
          move.to.x === col &&
          move.to.y === row
      )
    : null;

  // Square background color
  const isDarkSquare = (col + row) % 2 === 1;
  const squareBg = isDarkSquare ? "bg-[#ecd5bd]" : "bg-[#a77964]";

  // Condition for capturing or empty-square move indicator
  const handleClick = () => {
    if (foundMove && clickMoveHandler) {
      clickMoveHandler(foundMove);
    }
  };

  return (
    <div ref={setNodeRef} className={`relative w-16 h-16 ${squareBg}`}>
      {/* Highlight if selected or last move */}
      {highlightPos && (
        <div className="absolute w-full h-full bg-yellow-400 bg-opacity-45 z-0 pointer-events-none" />
      )}

      {/* If this is a valid "empty" square move */}
      {isValidMove && piece === Piece.NONE && (
        <div
          className="w-full h-full absolute z-10 top-0 left-0 cursor-pointer"
          onClick={handleClick}
        >
          <div
            className={`absolute left-[30%] top-[30%] w-2/5 h-2/5 rounded-full bg-gray-600 bg-opacity-40 z-10 ${
              foundMove ? "cursor-pointer" : "pointer-events-none"
            }`}
          />
        </div>
      )}

      {/* Child that renders the actual piece */}
      {children}

      {/* If this is a valid "capture" square move */}
      {isValidMove && piece !== Piece.NONE && (
        <div
          className="w-full h-full absolute z-10 top-0 left-0 cursor-pointer"
          onClick={handleClick}
        >
          <div
            className={`absolute left-[3%] top-[3%] w-[94%] h-[94%] rounded-full border-[0.3rem] border-gray-600 border-opacity-60 z-10 ${
              foundMove ? "cursor-pointer" : "pointer-events-none"
            }`}
          />
        </div>
      )}

      {/* Square Index for debugging (remove if you like) */}
      <div
        className={`absolute font-bold text-xs bottom-1 right-1 pointer-events-none ${
          isDarkSquare ? "text-[#ecd5bd]" : "text-[#a77964]"
        }`}
      >
        {row * 8 + col}
      </div>
    </div>
  );
}
