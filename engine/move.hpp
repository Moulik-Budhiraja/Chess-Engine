#pragma once

#include <iostream>
#include <string>

#include "piece.hpp"
#include "square.hpp"

#define MAX_MOVES 218       // Max moves in a chess position
#define MAX_PIECE_MOVES 27  // Max moves a single piece can make
#define MAX_MOVE_LINES 8

using namespace std;

namespace Flag {
constexpr int NONE = 0;
constexpr int PROMOTION_QUEEN = 0b1000;
constexpr int PROMOTION_ROOK = 0b0100;
constexpr int PROMOTION_BISHOP = 0b0010;
constexpr int PROMOTION_KNIGHT = 0b0001;

int fromPiece(int piece) {
    switch (piece) {
        case Piece::QUEEN:
            return PROMOTION_QUEEN;
        case Piece::ROOK:
            return PROMOTION_ROOK;
        case Piece::BISHOP:
            return PROMOTION_BISHOP;
        case Piece::KNIGHT:
            return PROMOTION_KNIGHT;
        default:
            throw invalid_argument("Invalid piece for promotion");
    }
}

int fromChar(char c) {
    switch (c) {
        case 'q':
            return PROMOTION_QUEEN;
        case 'r':
            return PROMOTION_ROOK;
        case 'b':
            return PROMOTION_BISHOP;
        case 'n':
            return PROMOTION_KNIGHT;
        default:
            throw invalid_argument("Invalid character for promotion");
    }
}

char toChar(int flag) {
    switch (flag) {
        case PROMOTION_QUEEN:
            return 'q';
        case PROMOTION_ROOK:
            return 'r';
        case PROMOTION_BISHOP:
            return 'b';
        case PROMOTION_KNIGHT:
            return 'n';
        default:
            throw invalid_argument("Invalid flag for promotion");
    }
}

}  // namespace Flag

class MoveLine {
   private:
    int m_from;
    int m_to;

   public:
    static const int CHECK = 0;
    static const int PIN = 1;

    // Null MoveLine
    MoveLine() : m_from(-1), m_to(-1) {}

    // Defined MoveLine
    MoveLine(int from, int to) : m_from(from), m_to(to) {}

    inline int getFrom() const { return m_from; }
    inline int getTo() const { return m_to; }

    bool isNull() const { return m_from == -1 && m_to == -1; }

    // Returns if square falls within the pin line
    bool inLine(int square) const {
        // Horizontal pin
        if (Square::rank(m_from) == Square::rank(m_to) && Square::file(m_from) != Square::file(m_to)) {
            return Square::rank(square) == Square::rank(m_from) &&
                   inBetween(Square::file(square), Square::file(m_from), Square::file(m_to));
        }

        // Vertical pin
        if (Square::rank(m_from) != Square::rank(m_to) && Square::file(m_from) == Square::file(m_to)) {
            return Square::file(square) == Square::file(m_from) &&
                   inBetween(Square::rank(square), Square::rank(m_from), Square::rank(m_to));
        }

        // Upward Diagonal
        if ((m_from - m_to) % 9 == 0 && (m_from - square) % 9 == 0 &&
            abs(Square::rank(m_from) - Square::rank(square)) == abs(Square::file(m_from) - Square::file(square))) {
            return inBetween(square, m_from, m_to);
        }

        // Downward Diagonal
        if ((m_from - m_to) % 7 == 0 && (m_from - square) % 7 == 0 &&
            abs(Square::rank(m_from) - Square::rank(square)) == abs(Square::file(m_from) - Square::file(square))) {
            return inBetween(square, m_from, m_to);
        }

        return false;
    }
};

class Move {
   private:
    int m_from;
    int m_to;
    int m_flags;  // 8 == q, 4 == r, 2 == b, 1 == n

   public:
    Move() : m_from(0), m_to(0), m_flags(0) {}
    Move(int from, int to, int flags) : m_from(from), m_to(to), m_flags(flags) {}
    Move(int from, int to) : m_from(from), m_to(to), m_flags(0) {}
    Move(string uci) {
        m_from = Square::fromUci(uci.substr(0, 2));
        m_to = Square::fromUci(uci.substr(2, 2));

        if (uci.length() > 4) {
            m_flags = Flag::fromChar(uci.at(4));
        } else {
            m_flags = Flag::NONE;
        }
    }

    inline int getFrom() const { return m_from; }
    inline int getTo() const { return m_to; }
    inline int getFlags() const { return m_flags; }
    inline int dx() const { return Square::file(m_to) - Square::file(m_from); }
    inline int dy() const { return Square::rank(m_to) - Square::rank(m_from); }

    inline bool isNull() const { return m_from == 0 && m_to == 0 && m_flags == 0; }
    inline int isPromotion() const { return m_flags != Flag::NONE; }
    int getPromotionPiece() const {
        switch (m_flags) {
            case Flag::PROMOTION_QUEEN:
                return Piece::QUEEN;
            case Flag::PROMOTION_ROOK:
                return Piece::ROOK;
            case Flag::PROMOTION_BISHOP:
                return Piece::BISHOP;
            case Flag::PROMOTION_KNIGHT:
                return Piece::KNIGHT;
            default:
                return Piece::NONE;
        }
    }

    string toUci(bool ignore_illegal = false) const {
        if (isPromotion()) {
            return Square::toUci(m_from, ignore_illegal) + Square::toUci(m_to, ignore_illegal) + Flag::toChar(m_flags);
        }
        return Square::toUci(m_from, ignore_illegal) + Square::toUci(m_to, ignore_illegal);
    }

    bool operator==(const Move& rhs) const {
        return (m_from == rhs.m_from) && (m_to == rhs.m_to) && (m_flags == rhs.m_flags);
    }

    static vector<string> getUciList(const vector<Move>& moves, bool ignore_illegal = false) {
        vector<string> uciList;
        for (const Move& move : moves) {
            uciList.push_back(move.toUci(ignore_illegal));
        }
        return uciList;
    }

    template <size_t N>
    static array<string, N> getUciArr(array<Move, N> arr) {
        array<string, N> uciArray;

        for (int i = 0; i < arr.size(); i++) {
            uciArray[i] = arr[i].toUci();
        }

        return uciArray;
    }

    template <size_t N>
    static array<string, N> getUciArr(stackvector<Move, N> arr) {
        array<string, N> uciArray;

        for (int i = 0; i < arr.size(); i++) {
            uciArray[i] = arr[i].toUci();
        }

        return uciArray;
    }
};
