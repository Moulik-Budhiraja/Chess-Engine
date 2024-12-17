import { get } from "http";
import { Piece, PieceColor, PieceType } from "./GetPiece";

type ReturnType = {
  board: number[][];
  turn: PieceColor;
  castling: number;
  enPassant: string;
  halfMove: number;
  fullMove: number;
};

function getCastlingFromFen(castling: string): number {
  let result = 0;
  if (castling.includes("K")) {
    result |= 0b1000;
  }
  if (castling.includes("Q")) {
    result |= 0b0100;
  }
  if (castling.includes("k")) {
    result |= 0b0010;
  }
  if (castling.includes("q")) {
    result |= 0b0001;
  }
  return result;
}

function castlingToFen(castling: number): string {
  let result = "";
  if (castling & 0b1000) {
    result += "K";
  }
  if (castling & 0b0100) {
    result += "Q";
  }
  if (castling & 0b0010) {
    result += "k";
  }
  if (castling & 0b0001) {
    result += "q";
  }

  if (!result) {
    result = "-";
  }

  return result;
}

export function boardFromFen(fen: string) {
  const [board, turn, castling, enPassant, halfMove, fullMove] = fen.split(" ");
  const boardArr = board.split("/").map((row) => {
    let newRow: number[] = [];
    for (let i = 0; i < row.length; i++) {
      if (!isNaN(parseInt(row[i]))) {
        newRow = [...newRow, ...Array(parseInt(row[i])).fill(Piece.NONE)];
      } else {
        newRow.push(getPieceFromChar(row[i]));
      }
    }
    return newRow;
  });

  boardArr.reverse();

  return {
    board: boardArr,
    turn: turn === "w" ? Piece.WHITE : Piece.BLACK,
    castling: getCastlingFromFen(castling),
    enPassant,
    halfMove: parseInt(halfMove),
    fullMove: parseInt(fullMove),
  } as ReturnType;
}

export function boardToFen(
  board: number[][],
  turn: PieceColor,
  castling: number,
  enPassant: string,
  halfMove: number,
  fullMove: number
) {
  const boardStr = [...board]
    .reverse()
    .map((row) => {
      let rowStr = "";
      let empty = 0;
      for (let i = 0; i < row.length; i++) {
        if (row[i] === Piece.NONE) {
          empty++;
        } else {
          if (empty > 0) {
            rowStr += empty;
            empty = 0;
          }
          rowStr += getCharFromPiece(row[i]);
        }
      }
      if (empty > 0) {
        rowStr += empty;
      }
      return rowStr;
    })
    .join("/");

  return `${boardStr} ${turn === Piece.WHITE ? "w" : "b"} ${castlingToFen(
    castling
  )} ${enPassant} ${halfMove} ${fullMove}`;
}

function getPieceFromChar(char: string): number {
  switch (char) {
    case "p":
      return Piece.PAWN | Piece.BLACK;
    case "n":
      return Piece.KNIGHT | Piece.BLACK;
    case "b":
      return Piece.BISHOP | Piece.BLACK;
    case "r":
      return Piece.ROOK | Piece.BLACK;
    case "q":
      return Piece.QUEEN | Piece.BLACK;
    case "k":
      return Piece.KING | Piece.BLACK;
    case "P":
      return Piece.PAWN | Piece.WHITE;
    case "N":
      return Piece.KNIGHT | Piece.WHITE;
    case "B":
      return Piece.BISHOP | Piece.WHITE;
    case "R":
      return Piece.ROOK | Piece.WHITE;
    case "Q":
      return Piece.QUEEN | Piece.WHITE;
    case "K":
      return Piece.KING | Piece.WHITE;
    default:
      return Piece.NONE;
  }
}

function getCharFromPiece(piece: number): string {
  switch (piece & 0b111) {
    case Piece.PAWN:
      return piece & Piece.BLACK ? "p" : "P";
    case Piece.KNIGHT:
      return piece & Piece.BLACK ? "n" : "N";
    case Piece.BISHOP:
      return piece & Piece.BLACK ? "b" : "B";
    case Piece.ROOK:
      return piece & Piece.BLACK ? "r" : "R";
    case Piece.QUEEN:
      return piece & Piece.BLACK ? "q" : "Q";
    case Piece.KING:
      return piece & Piece.BLACK ? "k" : "K";
    default:
      return "";
  }
}

export const STARTING_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
