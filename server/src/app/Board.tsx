"use client";

import {
  getValidMoves,
  MoveObj,
} from "@/engine/engineFunctions/moves/getValidMoves";
import { squareToUci } from "@/engine/engineFunctions/moves/moveHelper";
import {
  boardFromFen,
  boardToFen,
  STARTING_FEN,
} from "@/utils/chess/BoardFromFen";
import { GetPiece, Piece } from "@/utils/chess/GetPiece";
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
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import Arrow from "./Arrow";

const emptyBoard = Array.from({ length: 8 }, () =>
  Array.from({ length: 8 }, () => Piece.ROOK | Piece.WHITE)
);

for (let i = 0; i < 8; i++) {
  emptyBoard[1][i] = Piece.PAWN | Piece.WHITE;
  emptyBoard[6][i] = Piece.PAWN | Piece.BLACK;
  emptyBoard[2][i] = Piece.NONE;
  emptyBoard[3][i] = Piece.NONE;
  emptyBoard[4][i] = Piece.NONE;
  emptyBoard[5][i] = Piece.NONE;
}

type BoardProps = {
  startFen?: string;
  className?: string;
  onFenChange?: (fen: string) => void;
};

type ArrowObj = {
  from: number; // starting square index
  to: number; // ending square index
};

export default function Board({
  startFen = STARTING_FEN,
  className,
  onFenChange,
}: BoardProps) {
  const [board, setBoard] = useState(boardFromFen(STARTING_FEN).board);
  const [turn, setTurn] = useState(boardFromFen(STARTING_FEN).turn);
  const [castlingRights, setCastlingRights] = useState(
    boardFromFen(STARTING_FEN).castling
  );
  const [enPassant, setEnPassant] = useState(
    boardFromFen(STARTING_FEN).enPassant
  );

  const [validMoves, setValidMoves] = useState<MoveObj[]>([]);
  const [selectedPos, setSelectedPos] = useState<number | null>(null);
  const [lastMove, setLastMove] = useState<MoveObj | null>(null);

  // Arrow stuff
  const [arrows, setArrows] = useState<ArrowObj[]>([]);
  const [rightClickStartPos, setRightClickStartPos] = useState<number | null>(
    null
  );

  useEffect(() => {
    const newBoard = boardFromFen(startFen).board;
    const newTurn = boardFromFen(startFen).turn;
    const newCastlingRights = boardFromFen(startFen).castling;
    const newEnPassant = boardFromFen(startFen).enPassant;

    setBoard(newBoard);
    setTurn(newTurn);
    setCastlingRights(newCastlingRights);
    setEnPassant(newEnPassant);
  }, [startFen]);

  useEffect(() => {
    let pieceMoved: number | null = null;
    if (lastMove) {
      pieceMoved = board[lastMove?.to.y][lastMove?.to.x];
    }

    if (lastMove && pieceMoved && GetPiece(pieceMoved).type === Piece.PAWN) {
      if (Math.abs(lastMove?.to.y - lastMove?.from.y) === 2) {
        setEnPassant(
          squareToUci(
            lastMove?.to.y * 8 +
              lastMove?.to.x +
              ((pieceMoved & 0b11000) == Piece.WHITE ? -8 : 8)
          )
        );
      } else {
        setEnPassant("-");
      }
    }

    if (lastMove && pieceMoved && GetPiece(pieceMoved).type !== Piece.PAWN) {
      setEnPassant("-");
    }

    if (lastMove) {
      setCastlingRights((prev) => {
        const result = handleCastlingRights(board, lastMove, prev);
        console.log("Setting castling rights", result);
        return result;
      });
    }

    const fen = boardToFen(board, turn, castlingRights, enPassant, 0, 1);
    onFenChange?.(fen);

    const handler = setTimeout(() => {
      getValidMoves(fen).then((moves) => {
        console.log("Setting valid moves", moves);
        setValidMoves(moves);
      });
    }, 100);

    return () => {
      clearTimeout(handler);
    };
  }, [board, lastMove, castlingRights, enPassant]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // Minimum distance the pointer must move to activate the drag
      },
    }),
    useSensor(KeyboardSensor)
  );

  return (
    <DndContext
      collisionDetection={pointerWithin}
      sensors={sensors}
      modifiers={[snapCenterToCursor]}
      onDragEnd={async (event) => {
        const [newBoard, lastMove] = await handlePieceDrag(
          event,
          board,
          validMoves
        );
        setBoard(newBoard);
        setLastMove((prev) => lastMove ?? prev);
        if (lastMove) {
          setSelectedPos(null);
          setTurn((prev) => (prev === Piece.WHITE ? Piece.BLACK : Piece.WHITE));
        }
      }}
      onDragStart={(event) => {
        setSelectedPos(
          event.active.data.current?.col + event.active.data.current?.row * 8
        );
      }}
    >
      <div
        className={`relative w-[32rem] h-[32rem] ${className}`}
        onContextMenu={(e) => e.preventDefault()}
        onMouseMove={(e) => {
          if (document.getSelection()) {
            document.getSelection()?.empty();
          }
        }}
        onMouseDown={(e) => {
          if (e.button === 2) {
            e.preventDefault();
            const sqIndex = getSquareIndexFromEvent(e);
            setRightClickStartPos(sqIndex);
          }
        }}
        onMouseUp={(e) => {
          if (e.button === 2 && rightClickStartPos !== null) {
            e.preventDefault();
            const endPos = getSquareIndexFromEvent(e);
            if (endPos !== rightClickStartPos) {
              // Check if arrow already exists
              setArrows((prev) => {
                const arrowExists = prev.some(
                  (arrow) =>
                    arrow.from === rightClickStartPos && arrow.to === endPos
                );

                if (arrowExists) {
                  // Remove the arrow
                  return prev.filter(
                    (arrow) =>
                      !(
                        arrow.from === rightClickStartPos && arrow.to === endPos
                      )
                  );
                } else {
                  // Add a new arrow
                  return [...prev, { from: rightClickStartPos, to: endPos }];
                }
              });
            }
            setRightClickStartPos(null);
          } else {
            setArrows([]);
          }
        }}
      >
        {[...board].reverse().map((row, i) => (
          <div key={i} className="flex">
            {row.map((piece, j) => (
              <Square
                key={j}
                row={board.length - 1 - i}
                col={j}
                validMoves={validMoves}
                selectedPos={selectedPos}
                piece={piece}
                lastMove={lastMove}
                clickMoveHandler={(move) => {
                  handlePieceMove(
                    board,
                    move.from.y,
                    move.from.x,
                    move.to.y,
                    move.to.x,
                    validMoves
                  ).then(([newBoard, lastMove]) => {
                    setBoard(newBoard);
                    setLastMove((prev) => lastMove ?? prev);
                    if (lastMove) {
                      setTurn((prev) =>
                        prev === Piece.WHITE ? Piece.BLACK : Piece.WHITE
                      );
                    }
                  });
                }}
              >
                <BoardPiece
                  onClick={() => {
                    const current_pos = (board.length - 1 - i) * 8 + j;
                    if (selectedPos !== current_pos && piece !== Piece.NONE) {
                      setSelectedPos(current_pos);
                    } else {
                      setSelectedPos(null);
                    }
                  }}
                  piece={piece}
                  pos={(board.length - 1 - i) * 8 + j}
                />
              </Square>
            ))}
          </div>
        ))}

        {arrows.map((arrow, i) => (
          <Arrow key={i} from={arrow.from} to={arrow.to} />
        ))}
      </div>
    </DndContext>
  );
}

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
      row: row,
      col: col,
    },
  });

  const highlightPos =
    (row * 8 + col === selectedPos && piece !== Piece.NONE) ||
    (lastMove && lastMove.to.x === col && lastMove.to.y === row) ||
    (lastMove && lastMove.from.x === col && lastMove.from.y === row);
  const isValidMove =
    selectedPos !== null &&
    validMoves.some(
      (move) =>
        move.to.x === col &&
        move.to.y === row &&
        move.from.x === selectedPos % 8 &&
        move.from.y === Math.floor(selectedPos / 8)
    );

  // Get the move object that starts from the selected position and ends at the current position
  const move =
    isValidMove &&
    validMoves.find(
      (move) =>
        move.from.x === selectedPos % 8 &&
        move.from.y === Math.floor(selectedPos / 8) &&
        move.to.x === col &&
        move.to.y === row
    );

  return (
    <div
      ref={setNodeRef}
      className={`relative w-16 h-16 ${
        (col + row) % 2 == 0 ? "bg-[#ecd5bd]" : "bg-[#a77964]"
      }`}
    >
      {highlightPos && (
        <div className="absolute w-full h-full bg-yellow-400 bg-opacity-45 z-0 pointer-events-none"></div>
      )}
      {isValidMove && piece === Piece.NONE && (
        <div
          onClick={() => move && clickMoveHandler?.(move)}
          className={`absolute left-[30%] top-[30%] w-2/5 h-2/5 rounded-full bg-gray-600 bg-opacity-40 z-0 before:content-[''] before:absolute before:w-16 before:h-16 before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2 ${
            move ? "cursor-pointer" : "pointer-events-none"
          }`}
        ></div>
      )}
      {children}
      {isValidMove && piece !== Piece.NONE && (
        <div
          onClick={() => move && clickMoveHandler?.(move)}
          className={`absolute left-[3%] top-[3%] w-[94%] h-[94%] rounded-full border-[0.3rem] border-gray-600 border-opacity-60 z-10 before:content-[''] before:absolute before:w-16 before:h-16 before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2 ${
            move ? "cursor-pointer" : "pointer-events-none"
          }`}
        ></div>
      )}
      <div
        className={`absolute font-bold text-xs bottom-1 right-1 pointer-events-none ${
          (col + row) % 2 == 1 ? "text-[#ecd5bd]" : "text-[#a77964]"
        }`}
      >
        {row * 8 + col}
      </div>
    </div>
  );
}

type BoardPieceProps = {
  piece: number;
  pos: number;
  onClick?: () => void;
};

export function BoardPiece({ piece, pos, onClick }: BoardPieceProps) {
  const pieceDetails = GetPiece(piece);

  if (pieceDetails.type === Piece.NONE) {
    return <div className="w-full h-full " onClick={onClick}></div>;
  }

  const { attributes, listeners, setNodeRef, transform, over, isDragging } =
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
  };

  return (
    <div
      className={`w-full h-full p-[1px] relative ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      onClick={onClick}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
    >
      <img
        className="w-full h-full"
        src={pieceDetails.pieceImage}
        alt={`${pieceDetails.colorName} ${pieceDetails.typeName}`}
      />
    </div>
  );
}

async function handlePieceDrag(
  event: DragEndEvent,
  board: number[][],
  validMoves: MoveObj[]
): Promise<[number[][], MoveObj | null]> {
  const { active, over } = event;

  if (!active || !over) {
    return [board, null];
  }

  const fromRow = active.data.current?.row;
  const fromCol = active.data.current?.col;
  const toRow = over.data.current?.row;
  const toCol = over.data.current?.col;

  return handlePieceMove(board, fromRow, fromCol, toRow, toCol, validMoves);
}

async function handlePieceMove(
  board: number[][],
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  validMoves: MoveObj[]
): Promise<[number[][], MoveObj | null]> {
  const isValidMove = validMoves.some(
    (move) =>
      move.from.x === fromCol &&
      move.from.y === fromRow &&
      move.to.x === toCol &&
      move.to.y === toRow
  );

  if (!isValidMove) {
    return [board, null];
  }

  const newBoard = board.map((row) => [...row]);

  const startSquare = newBoard[fromRow][fromCol];
  const targetSquare = newBoard[toRow][toCol];
  const offset = toRow * 8 + toCol - (fromRow * 8 + fromCol);

  // En passant
  if (
    GetPiece(startSquare).type === Piece.PAWN &&
    GetPiece(targetSquare).type === Piece.NONE &&
    (Math.abs(offset) === 7 || Math.abs(offset) === 9)
  ) {
    newBoard[toRow - ((startSquare & 0b11000) === Piece.WHITE ? 1 : -1)][
      toCol
    ] = Piece.NONE;
  }

  // Castling
  if (GetPiece(startSquare).type === Piece.KING && Math.abs(offset) === 2) {
    const rookCol = offset > 0 ? 7 : 0;
    const rookRow = toRow;
    const rook = newBoard[rookRow][rookCol];
    newBoard[rookRow][rookCol] = Piece.NONE;
    newBoard[toRow][toCol - (offset > 0 ? 1 : -1)] = rook;
  }

  newBoard[fromRow][fromCol] = Piece.NONE;
  newBoard[toRow][toCol] = startSquare;

  return [
    newBoard,
    { from: { x: fromCol, y: fromRow }, to: { x: toCol, y: toRow } },
  ];
}

function handleCastlingRights(
  board: number[][],
  move: MoveObj,
  currentRights: number
): number {
  const targetSquare = board[move.to.y][move.to.x];

  const color = targetSquare & 0b11000;
  const king = Piece.KING | color;

  let newRights = currentRights;

  console.log(color, king, targetSquare);

  // If king moves
  if (targetSquare === king) {
    newRights &= color === Piece.WHITE ? 0b0011 : 0b1100;
  }

  // If rook moves
  if (GetPiece(targetSquare).type === Piece.ROOK) {
    if (move.from.x === 0 && move.from.y === (color === Piece.WHITE ? 0 : 7)) {
      newRights &= color === Piece.WHITE ? 0b1011 : 0b1110;
    }
    if (move.from.x === 7 && move.from.y === (color === Piece.WHITE ? 0 : 7)) {
      newRights &= color === Piece.WHITE ? 0b0111 : 0b1101;
    }
  }

  // If rook is captured, ie something else is at the original rook square
  if (move.to.x === 0 && move.to.y === (color === Piece.BLACK ? 0 : 7)) {
    newRights &= color === Piece.WHITE ? 0b1110 : 0b1011;
  }
  if (move.to.x === 7 && move.to.y === (color === Piece.BLACK ? 0 : 7)) {
    newRights &= color === Piece.WHITE ? 0b1101 : 0b0111;
  }

  console.log("New rights", newRights);

  return newRights;
}

function getSquareIndexFromEvent(e: React.MouseEvent<HTMLDivElement>): number {
  const mouseLocX = e.clientX - e.currentTarget.getBoundingClientRect().left;
  const mouseLocY = e.clientY - e.currentTarget.getBoundingClientRect().top;

  const sqIndex =
    (7 - Math.floor(mouseLocY / 64)) * 8 + Math.floor(mouseLocX / 64);
  return sqIndex;
}
