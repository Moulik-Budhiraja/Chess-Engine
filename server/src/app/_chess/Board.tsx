"use client";

import { useEffect, useState } from "react";
import {
  boardFromFen,
  boardToFen,
  STARTING_FEN,
} from "@/utils/chess/BoardFromFen";
import {
  GetPiece,
  getPieceColor,
  Piece,
  PieceColor,
} from "@/utils/chess/GetPiece";
import { squareToUci } from "@/engine/engineFunctions/moves/moveHelper";
import {
  getValidMoves,
  MoveObj,
} from "@/engine/engineFunctions/moves/getValidMoves";
import { serverLog } from "@/utils/debug/serverLog";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";

import Arrow from "./Arrow";
import { Square } from "./Square";
import PromotionWindow from "./PromotionWindow";
import { BoardPiece } from "./BoardPiece";
import { MoveEval } from "@/engine/engineFunctions/moves/getBestMove";

/* -------------------------------------------------------------------------- */
/*                                  Types                                      */
/* -------------------------------------------------------------------------- */

type BoardProps = {
  startFen?: string;
  engineDepth: number;
  engineTime?: number;
  className?: string;
  showEngine?: SideToggle;
  playEngine?: SideToggle;
  onFenChange?: (fen: string) => void;
  onMakeMove?: (move: MoveObj, newFen: string) => void;
  onEvaluationChange?: (newEval: number) => void;
  getWhiteBestMove: (
    fen: string,
    depth: number,
    engineTime: number
  ) => Promise<MoveEval>;
  getBlackBestMove: (
    fen: string,
    depth: number,
    engineTime: number
  ) => Promise<MoveEval>;
};

type ArrowObj = {
  from: number; // starting square index (0..63)
  to: number; // ending square index (0..63)
};

export type SideToggle = {
  forWhite: boolean;
  forBlack: boolean;
};

/* -------------------------------------------------------------------------- */
/*                                Board Component                              */
/* -------------------------------------------------------------------------- */

export default function Board({
  startFen = STARTING_FEN,
  engineDepth = 6,
  engineTime = 500,
  className,
  showEngine = {
    forWhite: false,
    forBlack: true,
  },
  playEngine = {
    forWhite: false,
    forBlack: false,
  },
  onFenChange,
  onMakeMove,
  onEvaluationChange,
  getWhiteBestMove,
  getBlackBestMove,
}: BoardProps) {
  // --------------------- State Management ---------------------------------
  const [board, setBoard] = useState<number[][]>(
    boardFromFen(STARTING_FEN).board
  );
  const [turn, setTurn] = useState<number>(boardFromFen(STARTING_FEN).turn);
  const [castlingRights, setCastlingRights] = useState<number>(
    boardFromFen(STARTING_FEN).castling
  );
  const [enPassant, setEnPassant] = useState<string>(
    boardFromFen(STARTING_FEN).enPassant
  );

  const [validMoves, setValidMoves] = useState<MoveObj[]>([]);
  const [selectedPos, setSelectedPos] = useState<number | null>(null);
  const [lastMove, setLastMove] = useState<MoveObj | null>(null);

  // Promotion
  const [showPromotion, setShowPromotion] = useState<boolean>(false);
  const [promotionMove, setPromotionMove] = useState<MoveObj | null>(null);

  // Arrows
  const [arrows, setArrows] = useState<ArrowObj[]>([]);
  const [rightClickStartPos, setRightClickStartPos] = useState<number | null>(
    null
  );

  const [bestMove, setBestMove] = useState<MoveObj | null>(null);

  // --------------------- Sensors (DnD Kit) ---------------------------------
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // Min distance pointer must move to activate the drag
      },
    }),
    useSensor(KeyboardSensor)
  );

  // --------------------- Effects -------------------------------------------
  /**
   * Sync the FEN-based board with the current startFen passed in from props.
   */
  useEffect(() => {
    const parsed = boardFromFen(startFen);
    setBoard(parsed.board);
    setTurn(parsed.turn);
    setCastlingRights(parsed.castling);
    setEnPassant(parsed.enPassant);
  }, [startFen]);

  /**
   * Whenever the board or relevant state changes, compute new valid moves,
   * run the engine if needed, and optionally play the engine move.
   */
  useEffect(() => {
    const fen = boardToFen(board, turn, castlingRights, enPassant, 0, 1);
    onFenChange?.(fen);

    const handler = setTimeout(async () => {
      const moves = await getValidMoves(fen);
      setValidMoves(moves);

      const solveBestMove =
        turn === Piece.WHITE ? getWhiteBestMove : getBlackBestMove;

      const moveEval = await solveBestMove(fen, engineDepth, engineTime);
      setBestMove(moveEval.move);
      onEvaluationChange?.(moveEval.eval);

      const isEngineTurn =
        (playEngine.forWhite && turn === Piece.WHITE) ||
        (playEngine.forBlack && turn === Piece.BLACK);

      if (isEngineTurn && moveEval.move) {
        const [newBoard, engineMove, promotionNeeded] = await handlePieceMove(
          board,
          moveEval.move.from.y,
          moveEval.move.from.x,
          moveEval.move.to.y,
          moveEval.move.to.x,
          moves,
          moveEval.move.promotion
        );
        if (promotionNeeded) {
          setPromotionMove(moveEval.move);
          setShowPromotion(true);
        } else {
          handleMoveUpdate(newBoard, engineMove);
        }
      }
    }, 100);

    return () => {
      clearTimeout(handler);
    };
    // We intentionally exclude some dependencies to avoid infinite loops
    // because we do a setTimeout engine computation here.
    // If you need to recalc on more changes, adjust accordingly.
  }, [board, lastMove, castlingRights, enPassant, engineDepth, engineTime]);

  // --------------------- Handlers ------------------------------------------
  /**
   * Called after a successful move (by user or engine).
   * Updates board, last move, turn, castling, en-passant, etc.
   */
  function handleMoveUpdate(newBoard: number[][], madeMove: MoveObj | null) {
    if (!madeMove) return;

    setBoard(newBoard);
    setLastMove(madeMove);
    setSelectedPos(null);
    setTurn((prev) => (prev === Piece.WHITE ? Piece.BLACK : Piece.WHITE));

    // Handle en-passant
    const piece = newBoard[madeMove.to.y][madeMove.to.x];
    let newEnPassant = enPassant;
    if (GetPiece(piece).type === Piece.PAWN) {
      if (Math.abs(madeMove.to.y - madeMove.from.y) === 2) {
        // e.g., a2-a4 sets en-passant on a3
        newEnPassant = squareToUci(
          madeMove.to.y * 8 +
            madeMove.to.x +
            (getPieceColor(piece) === Piece.WHITE ? -8 : 8)
        );
      } else {
        newEnPassant = "-";
      }
    } else {
      newEnPassant = "-";
    }
    setEnPassant(newEnPassant);

    // Handle castling rights
    const newRights = updateCastlingRights(newBoard, madeMove, castlingRights);
    setCastlingRights(newRights);

    // Notify parent
    const fenAfterMove = boardToFen(
      newBoard,
      turn === Piece.WHITE ? Piece.BLACK : Piece.WHITE,
      newRights,
      newEnPassant,
      0,
      1
    );
    onMakeMove?.(madeMove, fenAfterMove);
  }

  /**
   * Handles drag end event from dnd-kit, attempts to move the piece if valid.
   */
  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!active || !over) return;

    const fromRow = active.data.current?.row;
    const fromCol = active.data.current?.col;
    const toRow = over.data.current?.row;
    const toCol = over.data.current?.col;
    if (fromRow == null || fromCol == null || toRow == null || toCol == null) {
      return;
    }

    const [newBoard, moveDone, promotionNeeded] = await handlePieceMove(
      board,
      fromRow,
      fromCol,
      toRow,
      toCol,
      validMoves,
      null
    );
    if (promotionNeeded && moveDone) {
      setPromotionMove(moveDone);
      setShowPromotion(true);
    } else if (moveDone) {
      handleMoveUpdate(newBoard, moveDone);
    }
  }

  /**
   * Called when a square is clicked for a potential move.
   */
  function onClickSquareMove(move: MoveObj) {
    handlePieceMove(
      board,
      move.from.y,
      move.from.x,
      move.to.y,
      move.to.x,
      validMoves,
      null
    ).then(([newBoard, lastMove, promotionNeeded]) => {
      if (promotionNeeded && lastMove) {
        setPromotionMove(move);
        setShowPromotion(true);
      } else if (lastMove) {
        handleMoveUpdate(newBoard, lastMove);
      }
    });
  }

  /**
   * Mouse handling for right-click arrow creation/removal.
   */
  function handleRightClickMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button === 2) {
      e.preventDefault();
      const sqIndex = getSquareIndexFromEvent(e);
      setRightClickStartPos(sqIndex);
    }
  }
  function handleRightClickMouseUp(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button === 2 && rightClickStartPos !== null) {
      e.preventDefault();
      const endPos = getSquareIndexFromEvent(e);
      if (endPos !== rightClickStartPos) {
        setArrows((prev) => {
          const arrowExists = prev.some(
            (arrow) => arrow.from === rightClickStartPos && arrow.to === endPos
          );
          return arrowExists
            ? prev.filter(
                (arrow) =>
                  !(arrow.from === rightClickStartPos && arrow.to === endPos)
              )
            : [...prev, { from: rightClickStartPos, to: endPos }];
        });
      }
      setRightClickStartPos(null);
    } else {
      setArrows([]);
    }
  }

  // --------------------- Render --------------------------------------------
  return (
    <DndContext
      collisionDetection={pointerWithin}
      sensors={sensors}
      modifiers={[snapCenterToCursor]}
      onDragEnd={onDragEnd}
      onDragStart={(event) =>
        setSelectedPos(
          event.active.data.current?.col + event.active.data.current?.row * 8
        )
      }
    >
      <div
        className={`relative w-[32rem] h-[32rem] ${className}`}
        onContextMenu={(e) => e.preventDefault()}
        onMouseMove={() => document.getSelection()?.empty()}
        onMouseDown={handleRightClickMouseDown}
        onMouseUp={handleRightClickMouseUp}
      >
        {/* Board squares + pieces */}
        {[...board].reverse().map((row, i) => (
          <div key={i} className="flex">
            {row.map((piece, j) => (
              <Square
                key={j}
                row={board.length - 1 - i}
                col={j}
                piece={piece}
                selectedPos={selectedPos}
                validMoves={validMoves}
                lastMove={lastMove}
                clickMoveHandler={onClickSquareMove}
              >
                <BoardPiece
                  piece={piece}
                  pos={(board.length - 1 - i) * 8 + j}
                  onClick={() => {
                    const currentPos = (board.length - 1 - i) * 8 + j;
                    if (selectedPos !== currentPos && piece !== Piece.NONE) {
                      setSelectedPos(currentPos);
                    } else {
                      setSelectedPos(null);
                    }
                  }}
                />
              </Square>
            ))}
          </div>
        ))}

        {/* Promotion Popup */}
        {showPromotion && promotionMove && (
          <PromotionWindow
            promotionMove={promotionMove}
            turn={turn}
            setPromotionMove={(move) => {
              setPromotionMove(null);
              handlePieceMove(
                board,
                move.from.y,
                move.from.x,
                move.to.y,
                move.to.x,
                validMoves,
                move.promotion
              ).then(([newBoard, madeMove]) => {
                if (madeMove) handleMoveUpdate(newBoard, madeMove);
                setShowPromotion(false);
              });
            }}
          />
        )}

        {/* User-created arrows (right-click) */}
        {arrows.map((arrow, i) => (
          <Arrow key={i} from={arrow.from} to={arrow.to} />
        ))}

        {/* Engine arrows */}
        {bestMove &&
          board[bestMove.from.y][bestMove.from.x] !== Piece.NONE &&
          getPieceColor(board[bestMove.from.y][bestMove.from.x]) ===
            Piece.WHITE &&
          showEngine.forWhite && (
            <Arrow
              from={bestMove.from.y * 8 + bestMove.from.x}
              to={bestMove.to.y * 8 + bestMove.to.x}
              color="green"
            />
          )}
        {bestMove &&
          board[bestMove.from.y][bestMove.from.x] !== Piece.NONE &&
          getPieceColor(board[bestMove.from.y][bestMove.from.x]) ===
            Piece.BLACK &&
          showEngine.forBlack && (
            <Arrow
              from={bestMove.from.y * 8 + bestMove.from.x}
              to={bestMove.to.y * 8 + bestMove.to.x}
              color="green"
            />
          )}
      </div>
    </DndContext>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Helper Functions                                */
/* -------------------------------------------------------------------------- */

/**
 * Attempt to move the piece if it is a valid move.
 * Returns a tuple of [newBoard, moveUsed, promotionNeeded].
 */
async function handlePieceMove(
  board: number[][],
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  validMoves: MoveObj[],
  promotion: number | null
): Promise<[number[][], MoveObj | null, boolean]> {
  const isValidMove = validMoves.some(
    (move) =>
      move.from.x === fromCol &&
      move.from.y === fromRow &&
      move.to.x === toCol &&
      move.to.y === toRow
  );
  if (!isValidMove) return [board, null, false];

  const newBoard = board.map((r) => [...r]); // clone

  const startSquare = newBoard[fromRow][fromCol];
  const targetSquare = newBoard[toRow][toCol];
  const offset = toRow * 8 + toCol - (fromRow * 8 + fromCol);

  // If we need to show a promotion window (Pawn reaching last rank)
  if (
    GetPiece(startSquare).type === Piece.PAWN &&
    ((toRow === 0 && getPieceColor(startSquare) === Piece.BLACK) ||
      (toRow === 7 && getPieceColor(startSquare) === Piece.WHITE)) &&
    promotion === null
  ) {
    // We haven't chosen a promotion piece yet
    const partialMove: MoveObj = {
      from: { x: fromCol, y: fromRow },
      to: { x: toCol, y: toRow },
      promotion: null,
    };
    return [board, partialMove, true];
  }

  // En passant
  if (
    GetPiece(startSquare).type === Piece.PAWN &&
    GetPiece(targetSquare).type === Piece.NONE &&
    (Math.abs(offset) === 7 || Math.abs(offset) === 9)
  ) {
    // Remove the captured pawn behind the "to" square
    const direction = (startSquare & 0b11000) === Piece.WHITE ? 1 : -1;
    newBoard[toRow - direction][toCol] = Piece.NONE;
  }

  // Castling
  if (GetPiece(startSquare).type === Piece.KING && Math.abs(offset) === 2) {
    const rookCol = offset > 0 ? 7 : 0;
    const rookDestinationCol = toCol - (offset > 0 ? 1 : -1);
    const rook = newBoard[toRow][rookCol];
    newBoard[toRow][rookCol] = Piece.NONE;
    newBoard[toRow][rookDestinationCol] = rook;
  }

  // Move the piece
  newBoard[fromRow][fromCol] = Piece.NONE;
  newBoard[toRow][toCol] = startSquare;

  // If promoting
  if (promotion) {
    newBoard[toRow][toCol] = promotion | getPieceColor(startSquare);
  }

  const usedMove: MoveObj = {
    from: { x: fromCol, y: fromRow },
    to: { x: toCol, y: toRow },
    promotion: promotion ?? null,
  };
  return [newBoard, usedMove, false];
}

/**
 * Update castling rights given a particular move.
 */
function updateCastlingRights(
  newBoard: number[][],
  move: MoveObj,
  currentRights: number
): number {
  let newRights = currentRights;

  const movedPiece = newBoard[move.to.y][move.to.x];
  const color = movedPiece & 0b11000;
  const kingMask = Piece.KING | color;

  // If king moves, remove that side's castling rights
  if (movedPiece === kingMask) {
    // White => keep black bits (0b0011)
    // Black => keep white bits (0b1100)
    newRights &= color === Piece.WHITE ? 0b0011 : 0b1100;
  }

  // If rook moves, remove that rook's castling right
  if (GetPiece(movedPiece).type === Piece.ROOK) {
    // If left rook moved (x=0) or right rook moved (x=7), remove appropriate right
    if (move.from.x === 0 && move.from.y === (color === Piece.WHITE ? 0 : 7)) {
      newRights &= color === Piece.WHITE ? 0b1011 : 0b1110;
    }
    if (move.from.x === 7 && move.from.y === (color === Piece.WHITE ? 0 : 7)) {
      newRights &= color === Piece.WHITE ? 0b0111 : 0b1101;
    }
  }

  // If a rook is captured on its original square
  // White rooks start at (0,0) & (0,7)
  // Black rooks start at (7,0) & (7,7)
  const capturingColor = color;
  const oppositeColor =
    capturingColor === Piece.WHITE ? Piece.BLACK : Piece.WHITE;
  // If capturing color is white and we capture black's rook => black's castling rights
  // If capturing color is black and we capture white's rook => white's castling rights
  // The target squares for black's rooks: (0,0) or (0,7)
  // The target squares for white's rooks: (7,0) or (7,7)

  if (
    move.to.x === 0 &&
    move.to.y === (oppositeColor === Piece.WHITE ? 0 : 7)
  ) {
    // capturing color's opponent has lost the left rook
    newRights &= oppositeColor === Piece.WHITE ? 0b1011 : 0b1110;
  }
  if (
    move.to.x === 7 &&
    move.to.y === (oppositeColor === Piece.WHITE ? 0 : 7)
  ) {
    // capturing color's opponent has lost the right rook
    newRights &= oppositeColor === Piece.WHITE ? 0b0111 : 0b1101;
  }

  return newRights;
}

/**
 * Convert the mouse coordinate to a square index [0..63].
 */
function getSquareIndexFromEvent(e: React.MouseEvent<HTMLDivElement>): number {
  const rect = e.currentTarget.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const col = Math.floor(mouseX / 64);
  const row = 7 - Math.floor(mouseY / 64);
  return row * 8 + col;
}
