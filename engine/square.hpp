#pragma once

#include <iostream>
#include <string>

#define NUM_SQUARES 64

using namespace std;

namespace Square {

constexpr int A1 = 0;
constexpr int B1 = 1;
constexpr int C1 = 2;
constexpr int D1 = 3;
constexpr int E1 = 4;
constexpr int F1 = 5;
constexpr int G1 = 6;
constexpr int H1 = 7;
constexpr int A2 = 8;
constexpr int B2 = 9;
constexpr int C2 = 10;
constexpr int D2 = 11;
constexpr int E2 = 12;
constexpr int F2 = 13;
constexpr int G2 = 14;
constexpr int H2 = 15;
constexpr int A3 = 16;
constexpr int B3 = 17;
constexpr int C3 = 18;
constexpr int D3 = 19;
constexpr int E3 = 20;
constexpr int F3 = 21;
constexpr int G3 = 22;
constexpr int H3 = 23;
constexpr int A4 = 24;
constexpr int B4 = 25;
constexpr int C4 = 26;
constexpr int D4 = 27;
constexpr int E4 = 28;
constexpr int F4 = 29;
constexpr int G4 = 30;
constexpr int H4 = 31;
constexpr int A5 = 32;
constexpr int B5 = 33;
constexpr int C5 = 34;
constexpr int D5 = 35;
constexpr int E5 = 36;
constexpr int F5 = 37;
constexpr int G5 = 38;
constexpr int H5 = 39;
constexpr int A6 = 40;
constexpr int B6 = 41;
constexpr int C6 = 42;
constexpr int D6 = 43;
constexpr int E6 = 44;
constexpr int F6 = 45;
constexpr int G6 = 46;
constexpr int H6 = 47;
constexpr int A7 = 48;
constexpr int B7 = 49;
constexpr int C7 = 50;
constexpr int D7 = 51;
constexpr int E7 = 52;
constexpr int F7 = 53;
constexpr int G7 = 54;
constexpr int H7 = 55;
constexpr int A8 = 56;
constexpr int B8 = 57;
constexpr int C8 = 58;
constexpr int D8 = 59;
constexpr int E8 = 60;
constexpr int F8 = 61;
constexpr int G8 = 62;
constexpr int H8 = 63;

/// Large constants at bottom of file

inline int rank(int square) { return square / 8; }
inline int file(int square) { return square % 8; }

bool isOnBoard(int square) { return square >= 0 && square < 64; }

inline int byRankFile(int rank, int file) {
    if (rank < 0 || rank > 7 || file < 0 || file > 7) {
        throw out_of_range("Invalid rank or file: Must be between 0 and 7");
    }

    return rank * 8 + file;
}

int fromUci(const string& uci) {
    if (uci.length() != 2) {
        throw invalid_argument("Invalid UCI string: Must be 2 characters long");
    }

    char fileChar = uci[0];
    char rankChar = uci[1];

    if (fileChar < 'a' || fileChar > 'h' || rankChar < '1' || rankChar > '8') {
        throw invalid_argument("Invalid UCI string: File or rank out of bounds");
    }

    int file = fileChar - 'a';
    int rank = rankChar - '1';

    return byRankFile(rank, file);
}

string toUci(int square, bool ignore_illegal = false) {
    if ((square < 0 || square > 63) && !ignore_illegal) {
        throw out_of_range("Invalid square index: Must be between 0 and 63");
    }

    int file = square % 8;
    int rank = square / 8;

    char fileChar = file + 'a';
    char rankChar = rank + '1';

    return string(1, fileChar) + string(1, rankChar);
}

constexpr int ALL_SQUARES[64] = {0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
                                 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43,
                                 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63};

constexpr int DIRECTIONS[8] = {-8, 8, -1, 1, -9, -7, 7, 9};
constexpr int MAX_SLIDING_DISTANCE[64][8] = {
    {0, 7, 0, 7, 0, 0, 0, 7}, {0, 7, 1, 6, 0, 0, 1, 6}, {0, 7, 2, 5, 0, 0, 2, 5},
    {0, 7, 3, 4, 0, 0, 3, 4}, {0, 7, 4, 3, 0, 0, 4, 3}, {0, 7, 5, 2, 0, 0, 5, 2},
    {0, 7, 6, 1, 0, 0, 6, 1}, {0, 7, 7, 0, 0, 0, 7, 0}, {1, 6, 0, 7, 0, 1, 0, 6},
    {1, 6, 1, 6, 1, 1, 1, 6}, {1, 6, 2, 5, 1, 1, 2, 5}, {1, 6, 3, 4, 1, 1, 3, 4},
    {1, 6, 4, 3, 1, 1, 4, 3}, {1, 6, 5, 2, 1, 1, 5, 2}, {1, 6, 6, 1, 1, 1, 6, 1},
    {1, 6, 7, 0, 1, 0, 6, 0}, {2, 5, 0, 7, 0, 2, 0, 5}, {2, 5, 1, 6, 1, 2, 1, 5},
    {2, 5, 2, 5, 2, 2, 2, 5}, {2, 5, 3, 4, 2, 2, 3, 4}, {2, 5, 4, 3, 2, 2, 4, 3},
    {2, 5, 5, 2, 2, 2, 5, 2}, {2, 5, 6, 1, 2, 1, 5, 1}, {2, 5, 7, 0, 2, 0, 5, 0},
    {3, 4, 0, 7, 0, 3, 0, 4}, {3, 4, 1, 6, 1, 3, 1, 4}, {3, 4, 2, 5, 2, 3, 2, 4},
    {3, 4, 3, 4, 3, 3, 3, 4}, {3, 4, 4, 3, 3, 3, 4, 3}, {3, 4, 5, 2, 3, 2, 4, 2},
    {3, 4, 6, 1, 3, 1, 4, 1}, {3, 4, 7, 0, 3, 0, 4, 0}, {4, 3, 0, 7, 0, 4, 0, 3},
    {4, 3, 1, 6, 1, 4, 1, 3}, {4, 3, 2, 5, 2, 4, 2, 3}, {4, 3, 3, 4, 3, 4, 3, 3},
    {4, 3, 4, 3, 4, 3, 3, 3}, {4, 3, 5, 2, 4, 2, 3, 2}, {4, 3, 6, 1, 4, 1, 3, 1},
    {4, 3, 7, 0, 4, 0, 3, 0}, {5, 2, 0, 7, 0, 5, 0, 2}, {5, 2, 1, 6, 1, 5, 1, 2},
    {5, 2, 2, 5, 2, 5, 2, 2}, {5, 2, 3, 4, 3, 4, 2, 2}, {5, 2, 4, 3, 4, 3, 2, 2},
    {5, 2, 5, 2, 5, 2, 2, 2}, {5, 2, 6, 1, 5, 1, 2, 1}, {5, 2, 7, 0, 5, 0, 2, 0},
    {6, 1, 0, 7, 0, 6, 0, 1}, {6, 1, 1, 6, 1, 6, 1, 1}, {6, 1, 2, 5, 2, 5, 1, 1},
    {6, 1, 3, 4, 3, 4, 1, 1}, {6, 1, 4, 3, 4, 3, 1, 1}, {6, 1, 5, 2, 5, 2, 1, 1},
    {6, 1, 6, 1, 6, 1, 1, 1}, {6, 1, 7, 0, 6, 0, 1, 0}, {7, 0, 0, 7, 0, 7, 0, 0},
    {7, 0, 1, 6, 1, 6, 0, 0}, {7, 0, 2, 5, 2, 5, 0, 0}, {7, 0, 3, 4, 3, 4, 0, 0},
    {7, 0, 4, 3, 4, 3, 0, 0}, {7, 0, 5, 2, 5, 2, 0, 0}, {7, 0, 6, 1, 6, 1, 0, 0},
    {7, 0, 7, 0, 7, 0, 0, 0}};  // Maximum sliding distance for each square and direction
}  // namespace Square