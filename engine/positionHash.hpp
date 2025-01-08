#pragma once

#include <random>

#include "bitboard.hpp"  // To reuse getBoardIndex

using namespace std;

namespace PositionHashIndex {
constexpr int BLACK_TO_MOVE = 768;

constexpr int WHITE_KING_CASTLE = 769;
constexpr int WHITE_QUEEN_CASTLE = 770;
constexpr int BLACK_KING_CASTLE = 771;
constexpr int BLACK_QUEEN_CASTLE = 772;

constexpr int ENPASSANT_FILE_A = 773;

}  // namespace PositionHashIndex

class PositionHash {
   private:
    uint64_t m_hash;

    uint64_t m_identityKeys[781];

   public:
    PositionHash() : m_hash(0) {
        mt19937_64 engine;

        uint64_t fixed_seed = 835628211787;

        engine.seed(fixed_seed);

        uniform_int_distribution<uint64_t> dist(0, numeric_limits<uint64_t>::max());

        for (int i = 0; i < 781; i++) {
            m_identityKeys[i] = dist(engine);
        }
    }

    inline uint64_t get() { return m_hash; }

    void togglePiece(int piece, int square) { m_hash ^= m_identityKeys[BitBoard::getBoardIndex(piece) * 64 + square]; }

    void toggleTurn() { m_hash ^= m_identityKeys[PositionHashIndex::BLACK_TO_MOVE]; }

    // Pass Rights to toggle, wking, wqueen, bking, bqueen as bits of 4-bit-bin
    void toggleCastlingRights(int rights) {
        if (rights & 0b1000) m_hash ^= m_identityKeys[PositionHashIndex::WHITE_KING_CASTLE];
        if (rights & 0b0100) m_hash ^= m_identityKeys[PositionHashIndex::WHITE_QUEEN_CASTLE];
        if (rights & 0b0010) m_hash ^= m_identityKeys[PositionHashIndex::BLACK_KING_CASTLE];
        if (rights & 0b0001) m_hash ^= m_identityKeys[PositionHashIndex::BLACK_QUEEN_CASTLE];
    }

    void toggleEnPassant(int file) { m_hash ^= m_identityKeys[PositionHashIndex::ENPASSANT_FILE_A + file]; }

    void reset() { m_hash = 0; }
};
