#pragma once

#include <iostream>
#include <sstream>
#include <stack>
#include <string>
#include <vector>

#include "bitboard.hpp"
#include "helpers.hpp"
#include "move.hpp"
#include "piece.hpp"
#include "square.hpp"
#include "stackvector.hpp"

using namespace std;
using MoveLines = stackvector<MoveLine, MAX_MOVE_LINES>;

// Keeps track of last move data - used to unmake a move
struct MoveDelta {
    int movedPiecePos;
    int movedPieceEndPos;
    int takenPiece;
    int takenPiecePos;
    int originalCastlingRights;
    int originalEnPassant;
    int originalHalfmove;
    bool promotion;

    MoveDelta(int movedPiecePos, int takenPiecePos, int takenPiece, int originalEnPassant, int originalHalfmove,
              bool promotion, Move originalMove)
        : movedPiecePos(movedPiecePos),
          takenPiece(takenPiece),
          takenPiecePos(takenPiecePos),
          movedPieceEndPos(takenPiecePos),
          originalEnPassant(originalEnPassant),
          originalHalfmove(originalHalfmove),
          promotion(promotion),
          originalCastlingRights(0b1111) {};
};

class Board {
   private:
    int m_board[8][8] = {0};
    int m_turn;
    int m_castling;  // 0b1111, white kingside, white queenside, black kingside, black queenside
    int m_enPassant;
    int m_halfmove;
    int m_fullmove;

    array<uint64_t, NUM_BITBOARDS> m_bitboards = {0};

    stack<MoveDelta> m_moveHistory;
    stackvector<Move, MAX_MOVES> m_moveStack;

    ostream& m_debugStream;

    inline void setSquare(int square, int piece) { setSquare(Square::rank(square), Square::file(square), piece); }

    void setSquare(int rank, int file, int piece) {
        setBitboard(Square::byRankFile(rank, file), piece);

        m_board[rank][file] = piece;
    }

    void setBitboard(int square, int piece) {
        int originalPiece = getPiece(square);

        if (originalPiece != Piece::NONE) {
            // Clear the bit for the original piece
            BitBoard::clearBit(&m_bitboards[BitBoard::getBoardIndex(originalPiece)], square);
        }

        if (piece != Piece::NONE) {
            // Set the bit for the new piece
            BitBoard::setBit(&m_bitboards[BitBoard::getBoardIndex(piece)], square);
        }
    }

   public:
    Board(ostream& m_debugStream) : m_debugStream(m_debugStream) {
        setBoard("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    }
    Board(ostream& m_debugStream, const string& fen) : m_debugStream(m_debugStream) { setBoard(fen); }

    void setBoard(const string& fen) {
        // Reset the board and state variables
        for (int r = 0; r < 8; ++r)
            for (int f = 0; f < 8; ++f) setSquare(r, f, Piece::NONE);

        m_turn = Piece::WHITE;
        m_castling = 0;
        m_enPassant = -1;  // -1 signifies no en passant available
        m_halfmove = 0;
        m_fullmove = 1;

        // Split the FEN string into its components
        stringstream ss(fen);
        string piecePlacement, activeColor, castlingAvail, enPassantSquare, halfmoveStr, fullmoveStr;

        if (!(ss >> piecePlacement >> activeColor >> castlingAvail >> enPassantSquare >> halfmoveStr >> fullmoveStr)) {
            throw invalid_argument("Invalid FEN string: Incorrect number of fields");
        }

        // Parse piece placement
        int rank = 7;
        int file = 0;
        for (char c : piecePlacement) {
            if (c == '/') {
                rank--;
                file = 0;
            } else if (isdigit(c)) {
                file += c - '0';
            } else {
                int piece = Piece::fromChar(c);

                if (rank < 0 || rank > 7 || file < 0 || file > 7) {
                    throw out_of_range("Invalid FEN string: Rank or file out of bounds");
                }

                setSquare(rank, file, piece);

                file++;
            }
        }

        // Parse active color
        if (activeColor == "w") {
            m_turn = Piece::WHITE;
        } else if (activeColor == "b") {
            m_turn = Piece::BLACK;
        } else {
            throw invalid_argument("Invalid FEN string: Active color must be 'w' or 'b'");
        }

        // Parse castling availability
        if (castlingAvail != "-") {
            for (char c : castlingAvail) {
                switch (c) {
                    case 'K':
                        m_castling |= 8;
                        break;
                    case 'Q':
                        m_castling |= 4;
                        break;
                    case 'k':
                        m_castling |= 2;
                        break;
                    case 'q':
                        m_castling |= 1;
                        break;
                    default:
                        throw invalid_argument("Invalid FEN string: Invalid castling availability");
                }
            }
        }

        // Parse en passant square
        if (enPassantSquare != "-") {
            if (enPassantSquare.length() != 2 || enPassantSquare[0] < 'a' || enPassantSquare[0] > 'h' ||
                enPassantSquare[1] < '1' || enPassantSquare[1] > '8') {
                throw invalid_argument("Invalid FEN string: Invalid en passant square");
            }
            char fileChar = enPassantSquare[0];
            char rankChar = enPassantSquare[1];
            int epFile = fileChar - 'a';
            int epRank = (rankChar - '1');  // 0-based index
            m_enPassant = Square::byRankFile(epRank, epFile);
        }

        // Parse halfmove clock
        try {
            m_halfmove = stoi(halfmoveStr);
            if (m_halfmove < 0) throw invalid_argument("Halfmove clock cannot be negative");
        } catch (...) {
            throw invalid_argument("Invalid FEN string: Invalid halfmove clock");
        }

        // Parse fullmove number
        try {
            m_fullmove = stoi(fullmoveStr);
            if (m_fullmove <= 0) throw invalid_argument("Fullmove number must be positive");
        } catch (...) {
            throw invalid_argument("Invalid FEN string: Invalid fullmove number");
        }
    }

    string getFen() const {
        string fen = "";

        // 1. Piece Placement
        for (int r = 7; r >= 0; --r) {  // Start from rank 8 to 1
            int emptySquares = 0;
            for (int f = 0; f < 8; ++f) {  // File a to h
                int piece = getPiece(r, f);
                if (piece == 0) {
                    emptySquares++;
                } else {
                    if (emptySquares > 0) {
                        fen += to_string(emptySquares);
                        emptySquares = 0;
                    }

                    fen += Piece::toChar(piece);
                }
            }
            if (emptySquares > 0) {
                fen += to_string(emptySquares);
            }
            if (r > 0) {
                fen += '/';
            }
        }

        // 2. Active Color
        fen += ' ';
        fen += (m_turn == Piece::WHITE) ? 'w' : 'b';

        // 3. Castling Availability
        fen += ' ';
        string castlingStr = "";
        if (m_castling & 8) castlingStr += 'K';
        if (m_castling & 4) castlingStr += 'Q';
        if (m_castling & 2) castlingStr += 'k';
        if (m_castling & 1) castlingStr += 'q';
        if (castlingStr.empty()) castlingStr = "-";
        fen += castlingStr;

        // 4. En Passant Target Square
        fen += ' ';
        if (m_enPassant == -1) {
            fen += '-';
        } else {
            int epRank = m_enPassant / 8;
            int epFile = m_enPassant % 8;
            char fileChar = 'a' + epFile;
            char rankChar = '1' + epRank;
            fen += string{fileChar, rankChar};
        }

        // 5. Halfmove Clock
        fen += ' ';
        fen += to_string(m_halfmove);

        // 6. Fullmove Number
        fen += ' ';
        fen += to_string(m_fullmove);

        return fen;
    }

    string visualizeBoard(bool includeFen = true) {
        stringstream visual;

        for (int rank = 7; rank >= 0; rank--) {
            visual << "---------------------------------\n";
            for (int file = 0; file < 8; file++) {
                visual << "| " << Piece::toChar(getPiece(rank, file), true) << " ";
            }

            visual << "|\n";
        }
        visual << "---------------------------------\n";

        if (includeFen) {
            visual << "\nBoard Fen: " << getFen() << endl;
        }

        return visual.str();
    }

    string uciMoveStack() { return arrToString(Move::getUciArr(m_moveStack)); }

    inline int getTurn() { return m_turn; }
    inline int getNextTurn() { return m_turn == Piece::WHITE ? Piece::BLACK : Piece::WHITE; }

    inline int getPiece(int square) const { return m_board[Square::rank(square)][Square::file(square)]; }
    inline int getPiece(int rank, int file) const { return m_board[rank][file]; }

    stackvector<Move, MAX_MOVES> generateLegalMoves(bool capturesOnly = false) {
        stackvector<Move, MAX_MOVES> moves;
        MoveLines pinLines = generateMoveLines(m_turn, MoveLine::PIN);
        MoveLines checkLines = generateMoveLines(m_turn, MoveLine::CHECK);

        for (int square : Square::ALL_SQUARES) {
            if (getPiece(square) == Piece::NONE) continue;
            if (!Piece::isColor(getPiece(square), m_turn)) continue;

            moves.append(generateMovesForPiece(square, getPiece(square), checkLines, pinLines));
        }

        return moves;
    }

    stackvector<Move, MAX_PIECE_MOVES> generateMovesForPiece(int startSquare, int piece, const MoveLines& checkLines,
                                                             const MoveLines& pinLines) {
        stackvector<Move, MAX_PIECE_MOVES> moves;

        switch (Piece::getPieceType(piece)) {
            case Piece::BISHOP:
            case Piece::ROOK:
            case Piece::QUEEN:
                moves.append(generateSlidingMoves(startSquare, piece, checkLines, pinLines));
                break;
            case Piece::PAWN:
                moves.append(generatePawnMoves(startSquare, piece, checkLines, pinLines));
                break;

            case Piece::KNIGHT:
                moves.append(generateKnightMoves(startSquare, piece, checkLines, pinLines));
                break;

                // case Piece::KING:
                //     moves.append(generateKingMoves(startSquare, piece));
                //     break;

            default:
                break;
        }

        return moves;
    }

    stackvector<Move, MAX_PIECE_MOVES> generateSlidingMoves(int startSquare, int piece, const MoveLines& checkLines,
                                                            const MoveLines& pinLines) {
        int startDirIndex = Piece::isType(piece, Piece::BISHOP) ? 4 : 0;
        int endDirIndex = Piece::isType(piece, Piece::ROOK) ? 4 : 8;

        stackvector<Move, MAX_PIECE_MOVES> moves;

        MoveLine pinLine = getPinLine(pinLines, startSquare);

        // If double check, gg (no moves)
        MoveLine checkLine;
        if (checkLines.size() > 1) return moves;
        if (checkLines.size() == 1) checkLine = checkLines[0];

        m_debugStream << "Check Line: From: " << checkLine.getFrom() << " To: " << checkLine.getTo() << endl;

        for (int dirIndex = startDirIndex; dirIndex < endDirIndex; dirIndex++) {
            int dir = Square::DIRECTIONS[dirIndex];

            // Go only the number of squares in the direction that actually exist
            for (int i = 0; i < Square::MAX_SLIDING_DISTANCE[startSquare][dirIndex]; i++) {
                Move candidateMove;

                int destSquare = startSquare + dir * (i + 1);
                if (!Square::isOnBoard(destSquare)) {
                    break;
                }

                int destPiece = getPiece(destSquare);

                if (destPiece == Piece::NONE) {
                    candidateMove = Move(startSquare, destSquare);
                    if (inValidMoveLines(candidateMove, checkLine, pinLine)) moves.push_back(candidateMove);

                } else {
                    if (Piece::isColor(destPiece, m_turn)) {
                        break;
                    } else {
                        candidateMove = Move(startSquare, destSquare);
                        if (inValidMoveLines(candidateMove, checkLine, pinLine)) moves.push_back(candidateMove);
                        break;
                    }
                }
            }
        }

        return moves;
    }

    stackvector<Move, MAX_PIECE_MOVES> generatePawnMoves(int startSquare, int piece, const MoveLines& checkLines,
                                                         const MoveLines& pinLines) {
        stackvector<Move, MAX_PIECE_MOVES> moves;

        int dir = Piece::isColor(piece, Piece::WHITE) ? 8 : -8;

        // Single move
        int destSquare = startSquare + dir;
        if (Square::isOnBoard(destSquare) && getPiece(destSquare) == Piece::NONE) {
            if (Square::rank(destSquare) == 0 || Square::rank(destSquare) == 7) {
                moves.push_back(Move(startSquare, destSquare, Flag::PROMOTION_QUEEN));
                moves.push_back(Move(startSquare, destSquare, Flag::PROMOTION_ROOK));
                moves.push_back(Move(startSquare, destSquare, Flag::PROMOTION_BISHOP));
                moves.push_back(Move(startSquare, destSquare, Flag::PROMOTION_QUEEN));

            } else {
                moves.push_back(Move(startSquare, destSquare));
            }
        }

        // Double move
        if ((Piece::isColor(piece, Piece::WHITE) && Square::rank(startSquare) == 1) ||
            (Piece::isColor(piece, Piece::BLACK) && Square::rank(startSquare) == 6)) {
            int doubleDestSquare = startSquare + 2 * dir;
            if (getPiece(destSquare) == Piece::NONE && getPiece(doubleDestSquare) == Piece::NONE) {
                moves.push_back(Move(startSquare, doubleDestSquare));
            }
        }

        // Capture moves
        for (int i = -1; i <= 1; i += 2) {
            destSquare = startSquare + dir + i;
            if (Square::rank(destSquare) != Square::rank(startSquare + dir)) continue;

            if (Square::isOnBoard(destSquare) && Piece::isColor(getPiece(destSquare), m_turn ^ Piece::COLOR_MASK)) {
                moves.push_back(Move(startSquare, destSquare));
            }
            // enpassant
            if (Square::isOnBoard(destSquare) && destSquare == m_enPassant) {
                moves.push_back(Move(startSquare, destSquare));
            }
        }

        return moves;
    }

    stackvector<Move, MAX_PIECE_MOVES> generateKnightMoves(int startSquare, int piece, const MoveLines& checkLines,
                                                           const MoveLines& pinLines) {
        stackvector<Move, MAX_PIECE_MOVES> moves;

        MoveLine pinLine = getPinLine(pinLines, startSquare);

        // If double check, gg (no moves)
        MoveLine checkLine;
        if (checkLines.size() > 1) return moves;
        if (checkLines.size() == 1) checkLine = checkLines[0];

        for (int rankOff = -2; rankOff <= 2; rankOff++) {
            for (int fileOff = -2; fileOff <= 2; fileOff++) {
                int destSquare = startSquare + fileOff + rankOff * 8;
                if (abs(rankOff) + abs(fileOff) != 3) continue;
                if (!Square::isOnBoard(destSquare)) continue;
                if (Square::rank(destSquare) != Square::rank(startSquare) + rankOff) continue;
                if (Square::file(destSquare) != Square::file(startSquare) + fileOff) continue;

                if (Piece::isColor(getPiece(destSquare), m_turn)) continue;

                Move candidateMove = Move(startSquare, destSquare);

                if (inValidMoveLines(candidateMove, checkLine, pinLine)) moves.push_back(candidateMove);
            }
        }
        return moves;
    }

    stackvector<Move, MAX_PIECE_MOVES> generateKingMoves(int startSquare, int piece, const MoveLines& checkLines,
                                                         const MoveLines& pinLines) {
        stackvector<Move, MAX_PIECE_MOVES> moves;

        for (int rankOff = -1; rankOff <= 1; rankOff++) {
            for (int fileOff = -1; fileOff <= 1; fileOff++) {
                int targetSquare = startSquare + fileOff + rankOff * 8;

                if (!Square::isOnBoard(targetSquare)) continue;
                if (Square::rank(targetSquare) != Square::rank(startSquare) + rankOff) continue;
                if (Square::file(targetSquare) != Square::file(startSquare) + fileOff) continue;
                if (Piece::isColor(getPiece(targetSquare), m_turn)) continue;

                moves.push_back(Move(startSquare, targetSquare));
            }
        }

        // Castling
        int rights = m_castling & (Piece::isColor(piece, Piece::WHITE) ? 0b1100 : 0b11);
        rights = rights >> (Piece::isColor(piece, Piece::WHITE) ? 2 : 0);

        // cout << rights;

        // Queen side
        if (rights & 0b01) {
            bool blocked = false;
            for (int fileOff = 1; fileOff <= 3; fileOff++) {
                if (getPiece(Square::rank(startSquare), Square::file(startSquare) - fileOff) != Piece::NONE)
                    blocked = true;
            }

            if (!blocked) moves.push_back(Move(startSquare, startSquare - 2));
        }

        // King side
        if (rights & 0b10) {
            bool blocked = false;
            for (int fileOff = 1; fileOff <= 2; fileOff++) {
                if (getPiece(Square::rank(startSquare), Square::file(startSquare) + fileOff) != Piece::NONE)
                    blocked = true;
            }

            if (!blocked) moves.push_back(Move(startSquare, startSquare + 2));
        }

        return moves;
    }

    stackvector<int, NUM_SQUARES> getPieceLocations(int piece) {
        return BitBoard::getToggled(m_bitboards[BitBoard::getBoardIndex(piece)]);
    }

    // 0 - checkLine, 1 - pinLine
    // Warning: Only calculates for a single king
    MoveLines generateMoveLines(int kingColor, int lineType) {
        MoveLines pinLines;

        auto kingLocations = getPieceLocations(kingColor | Piece::KING);

        if (kingLocations.size() == 0) return pinLines;

        int kingSquare = kingLocations[0];

        // Pin line exists if there is a sliding piece of the opposite color after only a single friendly piece
        for (int dirIndex = 0; dirIndex < 8; dirIndex++) {
            int dir = Square::DIRECTIONS[dirIndex];
            int blockingPieces = 0;

            // Go only the number of squares in the direction that actually exist
            for (int i = 0; i < Square::MAX_SLIDING_DISTANCE[kingSquare][dirIndex]; i++) {
                int destSquare = kingSquare + dir * (i + 1);

                if (!Square::isOnBoard(destSquare)) {
                    break;
                }

                int destPiece = getPiece(destSquare);

                if (destPiece == Piece::NONE) continue;

                if ((destPiece == Piece::getOppositeColor(kingColor | Piece::QUEEN)) ||
                    (destPiece == Piece::getOppositeColor(kingColor | Piece::ROOK) && dirIndex < 4) ||
                    (destPiece == Piece::getOppositeColor(kingColor | Piece::BISHOP) && dirIndex >= 4)) {
                    if (blockingPieces == lineType) {
                        pinLines.push_back(MoveLine(kingSquare, destSquare));
                        break;
                    }
                } else {
                    blockingPieces++;
                }

                if (blockingPieces > 1) break;
            }
        }

        return pinLines;
    }

    MoveLine getPinLine(const MoveLines& pinLines, int square) {
        for (MoveLine pinLine : pinLines) {
            if (pinLine.inLine(square)) return pinLine;
        }

        return MoveLine();
    }

    bool inValidMoveLines(const Move& candidateMove, const MoveLine& checkLine, const MoveLine& pinLine) {
        // No check, not pinned
        if (checkLine.isNull() && pinLine.isNull()) {
            return true;
        }

        // Move must block the check, not pinned
        if (!checkLine.isNull() && pinLine.isNull() && checkLine.inLine(candidateMove.getTo())) {
            return true;
        }

        // No check, Move must stay within pin
        if (checkLine.isNull() && !pinLine.isNull() && pinLine.inLine(candidateMove.getTo())) {
            return true;
        }

        // Check and pinned, must block check and stay in pin
        if (!checkLine.isNull() && !pinLine.isNull() && pinLine.inLine(candidateMove.getTo()) &&
            checkLine.inLine(candidateMove.getTo())) {
            return true;
        }

        return false;
    }

    bool isAttackedByPawn(int square, int attackerColor) {
        uint64_t squareBoard = 1ULL << square;

        uint64_t pawnAttacks = 0;
        pawnAttacks |= (squareBoard & ~BitBoard::FILE_A) << 7;  // left
        pawnAttacks |= (squareBoard & ~BitBoard::FILE_H) << 9;  // right

        if (attackerColor == Piece::WHITE && (pawnAttacks >> 8 * 2) & getBitboard(Piece::WHITE | Piece::PAWN))
            return true;
        else if (attackerColor == Piece::BLACK && pawnAttacks & getBitboard(Piece::BLACK | Piece::PAWN))
            return true;

        return false;
    }

    // Returns True if the current turn player is in check
    bool isCheck() {
        for (const auto& kingSquare : getPieceLocations(m_turn | Piece::KING)) {
            uint64_t kingPos = 1ULL << kingSquare;

            uint64_t pawnAttacks = 0;
            uint64_t knightAttacks = 0;

            // Check if a pawn is giving check
            if (isAttackedByPawn(kingSquare, getNextTurn())) return true;

            // Check if a knight is giving check
            knightAttacks |= (kingPos & ~BitBoard::FILE_A) << 15;                       // 2 up, 1 left
            knightAttacks |= (kingPos & ~(BitBoard::FILE_A | BitBoard::FILE_B)) << 6;   // 1 up, 2 left
            knightAttacks |= (kingPos & ~(BitBoard::FILE_A | BitBoard::FILE_B)) >> 10;  // 1 down, 2 left
            knightAttacks |= (kingPos & ~BitBoard::FILE_A) >> 17;                       // 2 up, 1 left
            knightAttacks |= (kingPos & ~BitBoard::FILE_H) << 17;                       // 2 up, 1 left
            knightAttacks |= (kingPos & ~(BitBoard::FILE_H | BitBoard::FILE_G)) << 10;  // 1 up, 2 left
            knightAttacks |= (kingPos & ~(BitBoard::FILE_H | BitBoard::FILE_G)) >> 6;   // 1 down, 2 left
            knightAttacks |= (kingPos & ~BitBoard::FILE_H) >> 15;                       // 2 up, 1 left

            if (m_turn == Piece::WHITE && knightAttacks & getBitboard(Piece::BLACK | Piece::KNIGHT))
                return true;
            else if (m_turn == Piece::BLACK && knightAttacks & getBitboard(Piece::WHITE | Piece::KNIGHT))
                return true;

            // Check if a sliding piece is giving check
            for (int dirIndex = 0; dirIndex < 8; dirIndex++) {
                int dir = Square::DIRECTIONS[dirIndex];

                // Go only the number of squares in the direction that actually exist
                for (int i = 0; i < Square::MAX_SLIDING_DISTANCE[kingSquare][dirIndex]; i++) {
                    int destSquare = kingSquare + dir * (i + 1);
                    if (!Square::isOnBoard(destSquare)) {
                        break;
                    }

                    int destPiece = getPiece(destSquare);

                    if (destPiece == Piece::NONE) continue;

                    if (Piece::isColor(destPiece, m_turn))
                        break;
                    else if (Piece::isType(destPiece, Piece::QUEEN))
                        return true;
                    else if (Piece::isType(destPiece, Piece::ROOK) && dirIndex < 4)
                        return true;
                    else if (Piece::isType(destPiece, Piece::BISHOP) && dirIndex >= 4)
                        return true;
                    else
                        break;
                }
            }
        }

        return false;
    }

    bool isCheckmate() { return isCheckmate(generateLegalMoves()); }
    bool isCheckmate(const stackvector<Move, MAX_MOVES>& moves) {
        if (moves.size() == 0 && isCheck()) {
            return true;
        }
        return false;
    }

    bool isStalemate() { return isStalemate(generateLegalMoves()); }
    bool isStalemate(const stackvector<Move, MAX_MOVES>& moves) {
        if (moves.size() == 0 && !isCheck()) {
            return true;
        }

        if (m_halfmove == 100) return true;

        return false;
    }

    // Caller must make sure move is pseudo-legal
    MoveDelta makePseudoLegalMove(const Move& move) {
        // Handle Basic Move Logic //
        int movedPiece = getPiece(move.getFrom());
        int capturedPiece = getPiece(move.getTo());

        MoveDelta delta =
            MoveDelta(move.getFrom(), move.getTo(), capturedPiece, m_enPassant, m_halfmove, move.isPromotion(), move);

        if (movedPiece == Piece::NONE) {
            throw invalid_argument("Cannot make move: " + move.toUci() + " No piece at the source square: " +
                                   Square::toUci(move.getFrom()) + "\nBoard State:\n" + visualizeBoard());
        }

        setSquare(move.getTo(), movedPiece);
        setSquare(move.getFrom(), Piece::NONE);

        // Handle En-Passant
        // If a pawn captures the enpassant square, its En-Passant (Assuming Pseudo Legal Move)
        if (Piece::isType(movedPiece, Piece::PAWN) && move.getTo() == m_enPassant) {
            // 5th, and 4th rank by zero index
            if (Piece::isColor(movedPiece, Piece::WHITE)) {
                delta.takenPiece = getPiece(move.getTo() - 8);
                delta.takenPiecePos = move.getTo() - 8;

                setSquare(move.getTo() - 8, Piece::NONE);
            } else {
                delta.takenPiece = getPiece(move.getTo() + 8);
                delta.takenPiecePos = move.getTo() + 8;

                setSquare(move.getTo() + 8, Piece::NONE);
            }
        }

        // If a pawn jumps 2 squares then record the enpassant square
        if (Piece::isType(movedPiece, Piece::PAWN) && abs(move.dy()) == 2) {
            m_enPassant = Piece::isColor(movedPiece, Piece::WHITE) ? move.getFrom() + 8 : move.getFrom() - 8;
        } else {
            m_enPassant = -1;
        }

        // If the move has a promotion flag, change the end piece type
        if (move.isPromotion()) {
            setSquare(move.getTo(), m_turn | move.getPromotionPiece());
        }

        delta.originalCastlingRights = m_castling;

        // Handle Castling Rights
        int castleRightsMask = 0b1111;

        // If the king moves, remove that colors rights
        if (Piece::getPieceType(movedPiece) == Piece::KING) {
            castleRightsMask = Piece::isColor(movedPiece, Piece::WHITE) ? 0b0011 : 0b1100;
        }

        // Rook moved
        if (Piece::getPieceType(movedPiece) == Piece::ROOK) {
            switch (move.getFrom()) {
                case Square::A1:
                    castleRightsMask = 0b1011;
                    break;
                case Square::H1:
                    castleRightsMask = 0b0111;
                    break;
                case Square::A8:
                    castleRightsMask = 0b1110;
                    break;
                case Square::H8:
                    castleRightsMask = 0b1101;
                    break;
            }
        }

        // Rook captured
        if (Piece::getPieceType(capturedPiece) == Piece::ROOK) {
            switch (move.getTo()) {
                case Square::A1:
                    castleRightsMask = 0b1011;
                    break;
                case Square::H1:
                    castleRightsMask = 0b0111;
                    break;
                case Square::A8:
                    castleRightsMask = 0b1110;
                    break;
                case Square::H8:
                    castleRightsMask = 0b1101;
                    break;
            }
        }

        // Handle Castle
        if (movedPiece == (Piece::WHITE | Piece::KING) && move.dx() == 2) {
            setSquare(Square::F1, getPiece(Square::H1));
            setSquare(Square::H1, Piece::NONE);
        } else if (movedPiece == (Piece::WHITE | Piece::KING) && move.dx() == -2) {
            setSquare(Square::D1, getPiece(Square::A1));
            setSquare(Square::A1, Piece::NONE);
        } else if (movedPiece == (Piece::BLACK | Piece::KING) && move.dx() == 2) {
            setSquare(Square::F8, getPiece(Square::H8));
            setSquare(Square::H8, Piece::NONE);
        } else if (movedPiece == (Piece::BLACK | Piece::KING) && move.dx() == -2) {
            setSquare(Square::D8, getPiece(Square::A8));
            setSquare(Square::A8, Piece::NONE);
        }

        m_castling &= castleRightsMask;

        m_moveHistory.push(delta);

        m_turn = getNextTurn();

        m_halfmove += 1;
        if (capturedPiece != Piece::NONE || Piece::isType(movedPiece, Piece::PAWN)) m_halfmove = 0;
        if (m_turn == Piece::BLACK) m_fullmove += 1;

        m_moveStack.push_back(move);

        return delta;
    }

    Move unmakeLastMove() {
        m_moveStack.pop_back();

        MoveDelta delta = m_moveHistory.top();

        int fromSquare = delta.movedPiecePos;
        int toSquare = delta.movedPieceEndPos;
        int movedPiece = getPiece(toSquare);

        int promotionFlag = delta.promotion ? Flag::fromPiece(Piece::getPieceType(movedPiece)) : 0;

        Move returnMove = Move(fromSquare, toSquare, promotionFlag);

        // Unmake base move
        setSquare(fromSquare, movedPiece);
        setSquare(toSquare, Piece::NONE);
        setSquare(delta.takenPiecePos, delta.takenPiece);

        // Undo Promotion
        if (returnMove.isPromotion()) {
            setSquare(fromSquare, Piece::getColor(movedPiece) | Piece::PAWN);
        }

        // Unmake the castling move
        int dx = Square::file(toSquare) - Square::file(fromSquare);

        if (movedPiece == (Piece::WHITE | Piece::KING) && dx == 2) {
            setSquare(Square::H1, getPiece(Square::F1));
            setSquare(Square::F1, Piece::NONE);
        } else if (movedPiece == (Piece::WHITE | Piece::KING) && dx == -2) {
            setSquare(Square::A1, getPiece(Square::D1));
            setSquare(Square::D1, Piece::NONE);
        } else if (movedPiece == (Piece::BLACK | Piece::KING) && dx == 2) {
            setSquare(Square::H8, getPiece(Square::F8));
            setSquare(Square::F8, Piece::NONE);
        } else if (movedPiece == (Piece::BLACK | Piece::KING) && dx == -2) {
            setSquare(Square::A8, getPiece(Square::D8));
            setSquare(Square::D8, Piece::NONE);
        }

        // update member state
        m_turn = getNextTurn();
        m_castling = delta.originalCastlingRights;
        m_enPassant = delta.originalEnPassant;
        m_halfmove = delta.originalHalfmove;
        if (m_turn == Piece::WHITE) m_fullmove -= 1;

        m_moveHistory.pop();

        return returnMove;
    }

    uint64_t getBitboard(int piece) { return m_bitboards[BitBoard::getBoardIndex(piece)]; }
};
