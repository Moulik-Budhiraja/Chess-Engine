#pragma once

#include <stdint.h>

#include <sstream>

#include "piece.hpp"
#include "square.hpp"
#include "stackvector.hpp"

#define NUM_BITBOARDS 15

using namespace std;

namespace BitBoard {

constexpr int WHITE_PAWNS = 0;
constexpr int WHITE_KNIGHTS = 1;
constexpr int WHITE_BISHOPS = 2;
constexpr int WHITE_ROOKS = 3;
constexpr int WHITE_QUEENS = 4;
constexpr int WHITE_KING = 5;
constexpr int BLACK_PAWNS = 6;
constexpr int BLACK_KNIGHTS = 7;
constexpr int BLACK_BISHOPS = 8;
constexpr int BLACK_ROOKS = 9;
constexpr int BLACK_QUEENS = 10;
constexpr int BLACK_KING = 11;
constexpr int ALL_WHITE = 12;
constexpr int ALL_BLACK = 13;
constexpr int ALL_PIECES = 14;

constexpr uint64_t FILE_A = 0x101010101010101;
constexpr uint64_t FILE_B = FILE_A * 2;
constexpr uint64_t FILE_C = FILE_B * 2;
constexpr uint64_t FILE_D = FILE_C * 2;
constexpr uint64_t FILE_E = FILE_D * 2;
constexpr uint64_t FILE_F = FILE_E * 2;
constexpr uint64_t FILE_G = FILE_F * 2;
constexpr uint64_t FILE_H = FILE_G * 2;

constexpr uint64_t RANK_1 = 0xff;
constexpr uint64_t RANK_2 = RANK_1 << 8 * 1;
constexpr uint64_t RANK_3 = RANK_1 << 8 * 2;
constexpr uint64_t RANK_4 = RANK_1 << 8 * 3;
constexpr uint64_t RANK_5 = RANK_1 << 8 * 4;
constexpr uint64_t RANK_6 = RANK_1 << 8 * 5;
constexpr uint64_t RANK_7 = RANK_1 << 8 * 6;
constexpr uint64_t RANK_8 = RANK_1 << 8 * 7;

constexpr int PIECE_BOARDS[] = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11};

int getBoardIndex(int piece) {
    int index = Piece::getPieceType(piece) - 1;

    if (Piece::isColor(piece, Piece::WHITE))
        return index;
    else if (Piece::isColor(piece, Piece::BLACK))
        return index + 6;

    throw logic_error("Piece must be black or white in getBoardIndex");
}

stackvector<int, NUM_SQUARES> getToggled(uint64_t board) {
    stackvector<int, 64> toggled;

    while (board != 0) {
        // Find the index of the least significant set bit
        int index = __builtin_ctzll(board);
        toggled.push_back(index);

        // Clear the least significant set bit
        board &= (board - 1);
    }

    return toggled;
}

inline int getNumToggled(uint64_t board) { return __builtin_popcountll(board); }

inline uint64_t getBit(uint64_t board, int square) { return (board >> square) & 1ULL; }

inline void setBit(uint64_t* board, int square) { *board = *board | (1ULL << square); }

inline void clearBit(uint64_t* board, int square) { *board = *board & ~(1ULL << square); }

string visualize(uint64_t board) {
    stringstream visual;

    for (int rank = 7; rank >= 0; rank--) {
        visual << "----------------------------------\n";
        for (int file = 0; file < 8; file++) {
            visual << "| " << (getBit(board, Square::byRankFile(rank, file)) == 1 ? "X" : " ") << " ";
        }

        visual << " |\n";
    }
    visual << "----------------------------------\n";

    return visual.str();
}

}  // namespace BitBoard