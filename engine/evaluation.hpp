#pragma once

#include "piece.hpp"
#include "square.hpp"

using namespace std;

namespace PieceValues {

constexpr int PAWN_MIDDLE[] = {
    0,  0,   0,  0, 0,  0,  0,  0,   50,  50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30,  20,
    10, 10,  5,  5, 10, 25, 25, 10,  5,   5,  0,  0,  0,  20, 20, 0,  0,  0,  5,  -5, -10, 0,
    0,  -10, -5, 5, 5,  10, 10, -20, -20, 10, 10, 5,  0,  0,  0,  0,  0,  0,  0,  0,
};

constexpr int PAWN_END[] = {0,  0,  0,  0,  0,  0,  0,  0,  70, 70, 70, 70, 70, 70, 70, 70, 50, 50, 50, 50, 50, 50,
                            50, 50, 30, 30, 30, 30, 30, 30, 30, 30, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20,
                            20, 20, 20, 20, 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0};

constexpr int KNIGHT[] = {
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0,   0,   0,   0,   -20, -40, -30, 0,   10,  15,  15, 10,
    0,   -30, -30, 5,   15,  20,  20,  15,  5,   -30, -30, 0,   15,  20,  20,  15,  0,   -30, -30, 5,   10, 15,
    15,  10,  5,   -30, -40, -20, 0,   5,   5,   0,   -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
};

constexpr int BISHOP[] = {
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 0,   0,   0,   0,   0,   0,   -10, -10, 0,   5,   10,  10, 5,
    0,   -10, -10, 5,   5,   10,  10,  5,   5,   -10, -10, 0,   10,  10,  10,  10,  0,   -10, -10, 10,  10, 10,
    10,  10,  10,  -10, -10, 5,   0,   0,   0,   0,   5,   -10, -20, -10, -10, -10, -10, -10, -10, -20,
};

constexpr int ROOK[] = {
    0,  0, 0, 0, 0, 0, 0, 0,  5,  10, 10, 10, 10, 10, 10, 5,  -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5, -5, 0,  0,  0,  0,  0,  0,  -5, -5, 0, 0, 0, 0, 0, 0, -5, 0,  0, 0, 5, 5, 0, 0, 0,
};

constexpr int QUEEN[] = {
    -20, -10, -10, -5,  -5,  -10, -10, -20, -10, 0,  0, 0,   0,   0,   0,   -10, -10, 0,   5,   5,   5, 5,
    0,   -10, -5,  0,   5,   5,   5,   5,   0,   -5, 0, 0,   5,   5,   5,   5,   0,   -5,  -10, 5,   5, 5,
    5,   5,   0,   -10, -10, 0,   5,   0,   0,   0,  0, -10, -20, -10, -10, -5,  -5,  -10, -10, -20,
};

constexpr int KING_MIDDLE[] = {
    -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40,
    -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20,
    -20, -20, -20, -10, 20,  20,  0,   0,   0,   0,   20,  20,  20,  30,  10,  0,   0,   10,  30,  20,
};

constexpr int KING_END[] = {
    -50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0,   0,   -10, -20, -30, -30, -10, 20,  30,  30, 20,
    -10, -30, -30, -10, 30,  40,  40,  30,  -10, -30, -30, -10, 30,  40,  40,  30,  -10, -30, -30, -10, 20, 30,
    30,  20,  -10, -30, -30, -30, 0,   0,   0,   0,   -30, -30, -50, -30, -30, -30, -30, -30, -30, -50,
};

int getColorSquare(int square, int color) {
    // Get right perspective (this crude method only works because the tables are symmetric)
    return color == Piece::WHITE ? Square::H8 - square : square;
}

int getPieceSquareValue(int piece, int square, int totalPiecesLeft) {
    switch (Piece::getPieceType(piece)) {
        case Piece::PAWN: {
            int middle = PAWN_MIDDLE[getColorSquare(square, Piece::getColor(piece))];
            int end = PAWN_END[getColorSquare(square, Piece::getColor(piece))];

            if (totalPiecesLeft > 16) {
                return middle;
            }

            return middle + ((end - middle) * totalPiecesLeft) / 32;
        }

        case Piece::KNIGHT:
            return KNIGHT[getColorSquare(square, Piece::getColor(piece))];
        case Piece::BISHOP:
            return BISHOP[getColorSquare(square, Piece::getColor(piece))];
        case Piece::ROOK:
            return ROOK[getColorSquare(square, Piece::getColor(piece))];
        case Piece::QUEEN:
            return QUEEN[getColorSquare(square, Piece::getColor(piece))];
        case Piece::KING: {
            int middle = KING_MIDDLE[getColorSquare(square, Piece::getColor(piece))];
            int end = KING_END[getColorSquare(square, Piece::getColor(piece))];

            if (totalPiecesLeft > 16) {
                return middle;
            }

            return middle + ((end - middle) * totalPiecesLeft) / 32;
        }

        default:
            throw logic_error("Invalid Piece Type in getPieceSquareValue");
    }
}

}  // namespace PieceValues