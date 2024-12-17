#pragma once

#include <algorithm>
#include <array>
#include <chrono>
#include <iostream>
#include <string>

#include "board.hpp"
#include "move.hpp"
#include "piece.hpp"
#include "square.hpp"

#define MAX_SEARCH_DEPTH 5

using namespace std;

struct MoveEval {
    int eval;
    int depth;
    Move bestMove;

    MoveEval() : eval(INT_MIN), bestMove(Move(0, 0)), depth(0) {}
    MoveEval(int eval, int depth, Move bestMove) : eval(eval), bestMove(bestMove), depth(depth) {}
};

struct MoveScore {
    int score;
    Move move;

    bool operator<(const MoveScore& other) const { return score < other.score; }
    bool operator>(const MoveScore& other) const { return score > other.score; }
};

class Engine {
   private:
    Board m_board;
    ostream& m_outputStream;  // Reference to the output stream
    ostream& m_debugStream;

    // Debug
    int m_positionsSearched = 0;

   public:
    // Constructor accepting a stream
    Engine(ostream& stream, ostream& debugStream)
        : m_outputStream(stream), m_debugStream(debugStream), m_board(debugStream) {}

    void newGame() { newGame("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"); }
    void newGame(string fen) {
        m_board.setBoard(fen);

        m_debugStream << "Static Evaluation: " << evaluate(0) << endl;
        m_debugStream << "Is Checkmate: " << m_board.isCheckmate() << endl;
        m_debugStream << "Legal Moves: " << arrToString(Move::getUciArr(m_board.generateLegalMoves())) << endl;

        moveSearch();
    }

    void makePseudoLegalMove(Move move) { m_board.makePseudoLegalMove(move); }

    string showBoard() { return m_board.visualizeBoard(); }

    int evaluate(int ply) {
        int eval = 0;

        // Compute material from White's perspective
        for (int pos : Square::ALL_SQUARES) {
            int piece = m_board.getPiece(pos);
            eval += Piece::getMaterialValue(piece) * (Piece::isColor(piece, m_board.getTurn()) ? 1 : -1);
        }

        try {
            stackvector<Move, MAX_MOVES> legalMoves = m_board.generateLegalMoves();
            if (m_board.isCheckmate(legalMoves)) {
                return -100000 + ply;  // always negative if current player has no moves and is in check
            }

            if (m_board.isStalemate(legalMoves)) {
                return 0;
            }

        } catch (out_of_range e) {
            m_debugStream << m_board.getFen() << endl;
            throw out_of_range("HI");
        }

        return eval;
    }

    Move moveSearch() {
        m_debugStream << "Searching Position: " << endl;
        m_debugStream << m_board.visualizeBoard() << endl;
        // m_debugStream << BitBoard::visualize(m_board.getBitboard(Piece::QUEEN | Piece::WHITE)) << endl;

        // m_debugStream << BitBoard::visualize(m_board.getBitboard(Piece::PAWN | Piece::BLACK)) << endl;

        chrono::steady_clock::time_point begin = chrono::steady_clock::now();

        m_positionsSearched = 0;
        array<Move, MAX_SEARCH_DEPTH> principalVariation{};
        MoveEval searchResult = search(MAX_SEARCH_DEPTH, principalVariation);

        chrono::steady_clock::time_point end = chrono::steady_clock::now();

        m_debugStream << "\nSearch Time: " << chrono::duration_cast<chrono::milliseconds>(end - begin).count() << "ms"
                      << endl;
        m_debugStream << "Positions Searched: " << m_positionsSearched << endl << endl << endl;
        // m_debugStream << "Best Line: " << arrToString(Move::getUciArr(principalVariation))
        //               << "\nEval: " << searchResult.eval << endl;
        m_debugStream.flush();

        return searchResult.bestMove;
    }

    MoveEval search(int depth, array<Move, MAX_SEARCH_DEPTH>& pv, int alpha = INT_MIN, int beta = INT_MAX) {
        int ply = MAX_SEARCH_DEPTH - depth;

        if (depth <= 0) {
            m_positionsSearched++;
            for (int i = ply; i < MAX_SEARCH_DEPTH; i++) {
                pv[i] = Move(0, 0);
            }
            return {evaluate(ply), depth, Move(0, 0)};
        }

        stackvector<Move, MAX_MOVES> moves = orderMoves(m_board.generateLegalMoves());
        if (moves.empty()) {
            m_positionsSearched++;
            for (int i = ply; i < MAX_SEARCH_DEPTH; i++) {
                pv[i] = Move(0, 0);
            }
            return {evaluate(ply), depth, Move(0, 0)};
        }

        int bestEval = INT_MIN;
        Move bestMove(0, 0);
        int bestDepth = INT_MIN;

        bool foundBetterMove = false;

        for (Move move : moves) {
            array<Move, MAX_SEARCH_DEPTH> childPv{};
            m_board.makePseudoLegalMove(move);
            MoveEval res = search(depth - 1, childPv, -beta, -alpha);
            // m_debugStream << "Eval: " << -res.eval << "     \t" << m_board.uciMoveStack() << endl;
            m_board.unmakeLastMove();

            int eval = -res.eval;  // Negamax flip

            if (eval > bestEval) {
                bestEval = eval;
                bestMove = move;
                bestDepth = depth;

                alpha = bestEval;

                // Write the current best move at the current ply
                pv[ply] = move;

                // Copy the child's PV after the current move
                for (int i = ply + 1; i < MAX_SEARCH_DEPTH; i++) {
                    pv[i] = childPv[i];
                }

                foundBetterMove = true;
                // If at root depth, print this newly found best line
                if (depth == MAX_SEARCH_DEPTH) {
                    m_debugStream << "Evaluating Line: " << arrToString(Move::getUciArr(pv)) << "\t\tEval: " << eval
                                  << endl;
                }
            }

            if (bestEval >= beta) break;
        }

        if (depth == MAX_SEARCH_DEPTH) {
            m_debugStream << "Best Move: " << bestMove.toUci() << endl;
        }

        return {bestEval, bestDepth, bestMove};
    }

    stackvector<Move, MAX_MOVES> orderMoves(const stackvector<Move, MAX_MOVES>& moves) {
        stackvector<MoveScore, MAX_MOVES> scoredMoves;

        for (Move move : moves) {
            int moveScore = 0;
            // Captures are probably good
            if (m_board.getPiece(move.getTo()) != Piece::NONE)
                moveScore += Piece::getMaterialValue(m_board.getPiece(move.getTo())) -
                             Piece::getMaterialValue(m_board.getPiece(move.getFrom()));

            // Promotion is good
            if (move.isPromotion()) moveScore += 500;

            // Getting instantly taken by a pawn is probably not good
            if (m_board.isAttackedByPawn(move.getTo(), m_board.getNextTurn()) &&
                Piece::getMaterialValue(m_board.getPiece(move.getFrom())) > 100)
                moveScore -= Piece::getMaterialValue(m_board.getPiece(move.getFrom()));

            scoredMoves.push_back({moveScore, move});
        }

        sort(scoredMoves.begin(), scoredMoves.end(), [](const MoveScore& a, const MoveScore& b) {
            return a.score > b.score;  // Descending order
        });

        stackvector<Move, MAX_MOVES> orderedMoves;

        for (MoveScore scoredMove : scoredMoves) {
            orderedMoves.push_back(scoredMove.move);
        }

        return orderedMoves;
    }

    string getFen() const { return m_board.getFen(); }

    vector<Move> getLegalMoves() {
        vector<Move> moves;
        stackvector<Move, MAX_MOVES> stackMoves = m_board.generateLegalMoves();

        moves.insert(moves.end(), stackMoves.begin(), stackMoves.end());
        return moves;
    }
};