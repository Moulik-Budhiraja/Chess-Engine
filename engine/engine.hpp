#pragma once

#include <algorithm>
#include <array>
#include <chrono>
#include <iostream>
#include <string>
#include <utility>

#include "board.hpp"
#include "evaluation.hpp"
#include "move.hpp"
#include "piece.hpp"
#include "square.hpp"

#define NEG_INF -1000000  // Close enough for all intents and purposes
#define POS_INF 1000000

// #define

using namespace std;
using namespace std::chrono_literals;

struct MoveEval {
    int eval;
    Move bestMove;

    MoveEval() : eval(NEG_INF), bestMove(Move(0, 0)) {}
    MoveEval(int eval, Move bestMove) : eval(eval), bestMove(bestMove) {}
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

    chrono::steady_clock::time_point m_searchEnd;
    MoveEval m_lastBestMove;

    // Debug
    int m_positionsSearched = 0;

   public:
    // Constructor accepting a stream
    Engine(ostream& stream, ostream& debugStream)
        : m_board(debugStream), m_outputStream(stream), m_debugStream(debugStream) {}

    void newGame() { newGame("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"); }
    void newGame(string fen) {
        m_board.setBoard(fen);
        // m_debugStream << m_board.visualizeBoard() << endl;
    }

    void makeMove(Move move) {
        m_board.makeMove(move);
        // m_debugStream << m_board.visualizeBoard() << endl;
    }

    string showBoard() { return m_board.visualizeBoard(); }

    MoveEval moveSearch(int searchDepth, int maxSearchTimeMs) {
        m_debugStream << "Static Evaluation: " << evaluate() << endl;
        m_debugStream << "Is Check: " << m_board.isCheck() << endl;
        // m_debugStream << "Is Checkmate: " << m_board.isCheckmate() << endl;
        m_debugStream << "Total Moves: " << m_board.generateLegalMoves().size() << endl;
        // m_debugStream << "Legal Moves: " << arrToString(Move::getUciArr(m_board.generateLegalMoves())) << endl;
        m_debugStream << m_board.visualizeBoard() << endl;

        chrono::steady_clock::time_point begin = chrono::steady_clock::now();

        m_searchEnd = begin + chrono::milliseconds(maxSearchTimeMs);
        m_lastBestMove = MoveEval();
        m_positionsSearched = 0;

        int searchDepthReached = 0;

        for (int i = 1; i <= searchDepth; i++) {
            MoveEval searchResult = search(i, i);
            if (isSearchCanceled()) break;

            m_lastBestMove = searchResult;
            searchDepthReached = i;
        }

        chrono::steady_clock::time_point end = chrono::steady_clock::now();
        m_lastBestMove.eval = m_lastBestMove.eval * (m_board.getTurn() == Piece::WHITE ? 1 : -1);

        // m_debugStream << m_board.visualizeBoard() << endl;
        m_debugStream << "\nSearch Time: " << chrono::duration_cast<chrono::milliseconds>(end - begin).count() << "ms"
                      << endl;
        m_debugStream << "Depth: " << searchDepthReached << endl;
        m_debugStream << "Positions Searched: " << m_positionsSearched << endl;
        m_debugStream << "Evaluation: " << m_lastBestMove.eval << endl;
        m_debugStream << "Best Move: " << m_lastBestMove.bestMove.toUci() << endl;
        // m_debugStream << "Best Line: " << arrToString(Move::getUciArr(principalVariation));
        m_debugStream << "\nEval: " << m_lastBestMove.eval << endl << endl << endl;

        m_debugStream.flush();

        return m_lastBestMove;
    }

    inline bool isSearchCanceled() {
        return m_positionsSearched % 957 == 0 && chrono::steady_clock::now() > m_searchEnd - 3ms;
    }

    MoveEval search(int depth, int searchDepth, int alpha = NEG_INF, int beta = POS_INF) {
        int ply = searchDepth - depth + 1;
        if (depth <= 0) {
            return MoveEval(searchCaptures(alpha, beta), Move(0, 0));
        }

        if (isSearchCanceled()) {
            return MoveEval(POS_INF, Move(0, 0));  // This move will never be picked
        }

        stackvector<Move, MAX_MOVES> moves = m_board.generateLegalMoves();

        if (moves.empty()) {
            if (m_board.isCheck()) return MoveEval(NEG_INF + ply, Move(0, 0));
            return MoveEval(0, Move(0, 0));
        }

        orderMoves(moves, depth == searchDepth);

        MoveEval bestSoFar = MoveEval(NEG_INF, Move(0, 0));
        for (Move move : moves) {
            m_board.makeMove(move);
            MoveEval res = search(depth - 1, searchDepth, -beta, -alpha);
            res.eval = -res.eval;  // Negamax flip
            m_board.unmakeLastMove();

            if (res.eval > bestSoFar.eval) {
                bestSoFar.eval = res.eval;
                bestSoFar.bestMove = move;
            }
            alpha = max(bestSoFar.eval, alpha);
            if (beta <= alpha) break;
        }

        return bestSoFar;
    }

    int searchCaptures(int alpha, int beta) {
        int eval = evaluate();
        if (eval >= beta) {
            return beta;
        }
        alpha = max(alpha, eval);

        stackvector<Move, MAX_MOVES> moves = m_board.generateLegalMoves();
        orderMoves(moves, false);

        for (Move move : moves) {
            if (!Piece::isColor(m_board.getPiece(move.getTo()), m_board.getNextTurn())) continue;

            m_board.makeMove(move);
            int eval = -searchCaptures(-beta, -alpha);
            m_board.unmakeLastMove();

            if (eval >= beta) return beta;
            alpha = max(alpha, eval);
        }

        return alpha;
    }

    // Orders moves in place on the array
    void orderMoves(stackvector<Move, MAX_MOVES>& moves, bool isRoot) {
        stackvector<int, MAX_MOVES> moveScores;

        for (Move move : moves) {
            if (isRoot && move == m_lastBestMove.bestMove) {
                moveScores.push_back(POS_INF);  // Guarantee that best move gets searched first
            } else {
                moveScores.push_back(staticMoveEval(move));
            }
        }

        // Sort move array based on move scores (insertion sort)
        for (size_t i = 1; i < moves.size(); i++) {
            int scoreKey = moveScores[i];
            Move moveKey = moves[i];

            size_t j;
            for (j = i; j > 0 && scoreKey > moveScores[j - 1]; j--) {
                moveScores[j] = moveScores[j - 1];
                moves[j] = moves[j - 1];
            }
            moveScores[j] = scoreKey;
            moves[j] = moveKey;
        }
    }

    int staticMoveEval(Move move) {
        int score = 0;
        int movedPiece = m_board.getPiece(move.getFrom());
        int capturedPiece = m_board.getPiece(move.getTo());

        // Capture opponents high value pieces with our low value pieces
        if (capturedPiece != Piece::NONE)
            score += 10 * Piece::getMaterialValue(capturedPiece) - Piece::getMaterialValue(movedPiece);

        // Promotion is probably good
        if (move.getFlags() != Flag::NONE) score += Piece::getMaterialValue(move.getPromotionPiece());

        // Don't move piece to somewhere attacked by a pawn
        if (m_board.isAttackedByPawn(move.getTo(), m_board.getNextTurn())) score -= Piece::getMaterialValue(movedPiece);

        return score;
    }

    int evaluate() {
        m_positionsSearched++;

        int eval = 0;

        int numPieces = 0;

        // Compute material from White's perspective
        for (int piece : Piece::ALL_PIECES) {
            int num = BitBoard::getNumToggled(m_board.getBitboard(piece));
            eval += Piece::getMaterialValue(piece) * num * (Piece::isColor(piece, m_board.getTurn()) ? 1 : -1);
            numPieces += num;
        }

        for (int piece : Piece::ALL_PIECES) {
            for (int pos : m_board.getPieceLocations(piece)) {
                eval += PieceValues::getPieceSquareValue(piece, pos, numPieces) *
                        (Piece::isColor(piece, m_board.getTurn()) ? 1 : -1);
            }
        }

        return eval;
    }

    MoveEval getBestMove(int searchDepth, int maxSearchTimeMs = POS_INF) {
        return moveSearch(searchDepth, maxSearchTimeMs);
        // return MoveEval(0, Move(0, 1));
    }

    int getPiece(int square) { return m_board.getPiece(square); }

    string getFen() const { return m_board.getFen(); }

    string perft(int depth, bool multiDepth = false) {
        stringstream output;

        output << "\n";

        if (!multiDepth) {
            int val = moveTest(depth, depth, output);
            output << "\nMoves searched: " << val << endl;

        } else {
            stringstream nullStream;
            for (int i = 1; i < depth + 1; i++) {
                chrono::steady_clock::time_point begin = chrono::steady_clock::now();
                int moves = moveTest(i, i, nullStream);
                chrono::steady_clock::time_point end = chrono::steady_clock::now();
                output << "Depth: " << i << " ply Result: " << moves
                       << " positions Time: " << chrono::duration_cast<chrono::milliseconds>(end - begin).count()
                       << "ms" << endl;
            }
        }

        return output.str();
    }

    int moveTest(int depth, int topDepth, stringstream& output) {
        if (depth == 0) return 1;

        int total = 0;

        for (Move move : m_board.generateLegalMoves()) {
            m_board.makeMove(move);
            int val = moveTest(depth - 1, topDepth, output);
            total += val;
            if (depth == topDepth) {
                output << move.toUci() << ": " << val << endl;
            }
            m_board.unmakeLastMove();
        }

        return total;
    }

    vector<Move> getLegalMoves() {
        vector<Move> moves;
        stackvector<Move, MAX_MOVES> stackMoves = m_board.generateLegalMoves();

        moves.insert(moves.end(), stackMoves.begin(), stackMoves.end());
        return moves;
    }

    // Game winner can be none, white, black, draw
    string getGameWinner() {
        stackvector<Move, MAX_MOVES> moves = m_board.generateLegalMoves();

        if (moves.empty()) {
            if (m_board.isCheck()) return m_board.getTurn() == Piece::WHITE ? "black" : "white";
            return "draw";
        }

        return "none";
    }
};