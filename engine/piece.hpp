#pragma once

using namespace std;

namespace Piece {

constexpr int NONE = 0;
constexpr int PAWN = 1;
constexpr int KNIGHT = 2;
constexpr int BISHOP = 3;
constexpr int ROOK = 4;
constexpr int QUEEN = 5;
constexpr int KING = 6;

constexpr int WHITE = 8;
constexpr int BLACK = 16;

constexpr int TYPE_MASK = 0b111;
constexpr int COLOR_MASK = 0b11000;

inline bool isColor(int piece, int color) { return (piece & COLOR_MASK) == color; }
inline bool isType(int piece, int type) { return (piece & TYPE_MASK) == type; }

inline int getPieceType(int piece) { return piece & TYPE_MASK; }
inline int getColor(int piece) { return piece & COLOR_MASK; }

// Warning: Undefined behaviour for non color input
inline int getOppositeColor(int color) { return color ^ 0b11000; }

int fromChar(char c) {
    int piece = 0;
    switch (tolower(c)) {
        case 'p':
            piece = Piece::PAWN;
            break;
        case 'n':
            piece = Piece::KNIGHT;
            break;
        case 'b':
            piece = Piece::BISHOP;
            break;
        case 'r':
            piece = Piece::ROOK;
            break;
        case 'q':
            piece = Piece::QUEEN;
            break;
        case 'k':
            piece = Piece::KING;
            break;
        default:
            // cout << c << endl;
            throw invalid_argument("Unknown piece type in fromChar in Piece");
    }

    if (isupper(c)) {
        piece |= Piece::WHITE;
    } else {
        piece |= Piece::BLACK;
    }

    return piece;
}

char toChar(int piece, bool allowNone = false) {
    char pieceChar;
    int pieceType = piece & Piece::TYPE_MASK;  // Extract piece type
    bool isWhite = (piece & Piece::COLOR_MASK) == Piece::WHITE;

    switch (pieceType) {
        case Piece::PAWN:
            pieceChar = isWhite ? 'P' : 'p';
            break;
        case Piece::KNIGHT:
            pieceChar = isWhite ? 'N' : 'n';
            break;
        case Piece::BISHOP:
            pieceChar = isWhite ? 'B' : 'b';
            break;
        case Piece::ROOK:
            pieceChar = isWhite ? 'R' : 'r';
            break;
        case Piece::QUEEN:
            pieceChar = isWhite ? 'Q' : 'q';
            break;
        case Piece::KING:
            pieceChar = isWhite ? 'K' : 'k';
            break;
        case Piece::NONE:
            if (allowNone)
                pieceChar = ' ';
            else
                throw logic_error("Unknown piece type in toChar in Piece");
            break;
        default:
            throw logic_error("Unknown piece type in toChar in Piece");
    }

    return pieceChar;
}

int getMaterialValue(int piece) {
    switch (getPieceType(piece)) {
        case Piece::NONE:
            return 0;
        case Piece::PAWN:
            return 100;
        case Piece::KNIGHT:
            return 300;
        case Piece::BISHOP:
            return 320;
        case Piece::ROOK:
            return 500;
        case Piece::QUEEN:
            return 900;
        case Piece::KING:
            return 0;

        default:
            throw invalid_argument("Invalid piece type in getMaterialValue");
    }
}

};  // namespace Piece