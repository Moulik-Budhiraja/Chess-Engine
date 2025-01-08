#include <algorithm>
#include <cctype>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

#include "engine.hpp"
#include "helpers.hpp"

using namespace std;

class EngineInterface {
   private:
    ofstream m_debugFile;
    Engine m_engine;

   public:
    EngineInterface() : m_debugFile("debug.txt"), m_engine(cout, m_debugFile) {
        if (!m_debugFile) {
            throw runtime_error("Could not open output file");
        }

        m_debugFile.setf(ios::unitbuf);

        m_debugFile << "EngineInterface initialized\n";
    }

    ~EngineInterface() { m_debugFile.close(); }

    void uci() {
        cout << "id name Moulik's Engine\n";
        cout << "id author Moulik\n";
        cout << "uciok\n";
    }

    void isready() { cout << "readyok\n"; }

    void ucinewgame() {
        m_engine.newGame();
        cout << "New game initialized.\n";
    }

    void position(const vector<string>& args) {
        cout << "Set position called with args: " << vecToString(args) << "\n";
        if (args[0] == "startpos") {
            m_engine.newGame();

            for (size_t i = 1; i < args.size(); i++) {
                m_engine.makeMove(Move(args[i]));
            }

        } else if (args[0] == "fen") {
            // Combine the rest of the args into a single string

            string fen = vecToString(args, true, 1);
            m_engine.newGame(fen);
        } else {
            cout << "Unknown position command: " << args[0] << "\n";
        }
    }

    void showboard() { cout << m_engine.showBoard() << endl; }

    // Stub for the 'go' command
    void go(const vector<string>& args) {
        if (args.empty()) {
            cout << "Go command called no args" << endl;
            return;
        }

        string firstArg = args[0];

        if (firstArg == "perft") {
            vector<string> restArgs(args.begin() + 1, args.end());
            perft(restArgs);
        }

        // Here you would implement the search algorithm based on provided parameters
    }

    void perft(const vector<string>& args) {
        if (args.empty()) {
            cout << "perft command called no args, please pass depth" << endl;
            return;
        }

        bool multiDepth = false;

        if (args.size() > 1 && args[1] == "-d") multiDepth = true;

        int depth = stoi(args[0]);

        cout << m_engine.perft(depth, multiDepth) << endl;
    }

    void getfen() { cout << m_engine.getFen() << "\n"; }

    void getmoves() {
        vector<string> uciMoves;

        for (Move move : m_engine.getLegalMoves()) {
            uciMoves.push_back(move.toUci());
        }

        cout << vecToString(uciMoves, true) << "\n";
    }

    void getbestmove(const vector<string>& args) {
        if (args.empty()) {
            cout << "getbestmove called with no args. Useage: getbestmove <depth> [maxSearchTime]" << endl;
            return;
        }

        int depth = stoi(args[0]);
        int maxSearchTimeMs = 1000000;

        // Second arg is max search time
        if (args.size() == 2) {
            maxSearchTimeMs = stoi(args[1]);
        }

        MoveEval bestMove = m_engine.getBestMove(depth, maxSearchTimeMs);

        cout << bestMove.bestMove.toUci() << " " << bestMove.eval << endl;
    }

    void getbestpiece(const vector<string>& args) {
        if (args.empty()) {
            cout << "getbestpiece called with no args. Useage: getbestpiece <depth> [maxSearchTime]" << endl;
            return;
        }

        int depth = stoi(args[0]);
        int maxSearchTimeMs = 1000000;

        // Second arg is max search time
        if (args.size() == 2) {
            maxSearchTimeMs = stoi(args[1]);
        }

        MoveEval bestMove = m_engine.getBestMove(depth, maxSearchTimeMs);

        cout << Piece::toChar(m_engine.getPiece(bestMove.bestMove.getFrom())) << " " << bestMove.eval << endl;
    }

    void getgamewinner() { cout << m_engine.getGameWinner() << endl; }

    // Stub for the 'stop' command
    void stop() {
        cout << "Stop command received. Halting search.\n";
        // Here you would implement logic to stop the search
    }

    void quit() {
        cout << "Quit command received. Shutting down engine.\n";
        exit(0);
    }

    void listen() {
        string line;
        while (getline(cin, line)) {
            line = trim(line);
            if (line.empty()) continue;

            istringstream iss(line);
            string command;
            iss >> command;

            // Make lowercase
            transform(command.begin(), command.end(), command.begin(), [](unsigned char c) { return tolower(c); });

            // Get everything after and put it in a vector of strings
            string arg;
            vector<string> args;
            while (iss >> arg) {
                args.push_back(arg);
            }

            if (command == "uci") {
                uci();
            } else if (command == "isready") {
                isready();
            } else if (command == "ucinewgame") {
                ucinewgame();
            } else if (command == "position") {
                position(args);
            } else if (command == "go") {
                go(args);
            } else if (command == "getfen") {
                getfen();
            } else if (command == "d") {
                showboard();
            } else if (command == "getmoves") {
                getmoves();
            } else if (command == "getbestmove") {
                getbestmove(args);
            } else if (command == "getbestpiece") {
                getbestpiece(args);
            } else if (command == "getgamewinner") {
                getgamewinner();
            } else if (command == "stop") {
                stop();
            } else if (command == "quit") {
                quit();
            } else {
                cout << "Unknown command: " << command << "\n";
            }
        }
    }

   private:
    // Helper function to trim leading and trailing whitespace
    string trim(const string& s) {
        size_t start = s.find_first_not_of(" \t\r\n");
        size_t end = s.find_last_not_of(" \t\r\n");
        if (start == string::npos) return "";
        return s.substr(start, end - start + 1);
    }
};
