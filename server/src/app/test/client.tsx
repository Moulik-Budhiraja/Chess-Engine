"use client";

import Button from "@/components/Button/Button";
import Board from "../_chess/Board";
import {
  listEngines,
  loadBlackTestEngine,
  loadWhiteTestEngine,
  saveEngine,
} from "@/engine/engineFunctions/engineOperations";
import { useEffect, useRef, useState } from "react";
import { serverLog } from "@/utils/debug/serverLog";
import { boardFromFen, STARTING_FEN } from "@/utils/chess/BoardFromFen";
import EvalBar from "../_chess/EvalBar";
import { MoveObj } from "@/engine/engineFunctions/moves/getValidMoves";
import { Piece } from "@/utils/chess/GetPiece";
import { squareToUci } from "@/engine/engineFunctions/moves/moveHelper";
import {
  solveBlackTestEngineBestMove,
  solveWhiteTestEngineBestMove,
} from "@/engine/engineFunctions/moves/getBestMove";
import WinBar from "../_chess/WinBar";
import { testGameFens } from "./testGameFens";
import { getGameWinner } from "@/engine/engineFunctions/moves/getGameWinner";

type MoveStep = {
  fen: string;
  move: MoveObj;
};

const defaultEngineName = "Latest";

export default function Client() {
  const [currentFen, setCurrentFen] = useState<string>(STARTING_FEN);
  const [evaluation, setEvaluation] = useState(0);
  const [engineDepth, setEngineDepth] = useState(6);
  const [engineTime, setEngineTime] = useState(500);
  const [showEngine, setShowEngine] = useState({
    forWhite: true,
    forBlack: true,
  });
  const [playEngine, setPlayEngine] = useState({
    forWhite: false,
    forBlack: false,
  });

  const [availableEngines, setAvailableEngines] = useState<string[]>([]);

  const [whiteEngine, setWhiteEngine] = useState<string>(defaultEngineName);
  const [blackEngine, setBlackEngine] = useState<string>(defaultEngineName);

  const [playGame, setPlayGame] = useState<number | null>(null);

  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [draws, setDraws] = useState(0);

  const [moveHistory, setMoveHistory] = useState<MoveStep[]>([]);

  const movesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    serverLog("Play Game", playGame);
    if (playGame !== null && playGame >= testGameFens.length) {
      setPlayGame(null);
      setCurrentFen(STARTING_FEN);
      setMoveHistory([]);
      setPlayEngine({ forWhite: false, forBlack: false });
    }
    if (playGame !== null && playGame < testGameFens.length) {
      setCurrentFen(testGameFens[playGame]);
      setMoveHistory([]);
      setPlayEngine({ forWhite: true, forBlack: true });
    }
  }, [playGame]);

  useEffect(() => {
    if (movesRef.current) {
      movesRef.current.scrollTop = movesRef.current.scrollHeight;
    }
  }, [moveHistory]);

  useEffect(() => {
    listEngines().then((engines) => {
      setAvailableEngines([...engines, defaultEngineName]);
    });
  }, []);

  useEffect(() => {
    if (whiteEngine === defaultEngineName) {
      loadWhiteTestEngine("../engine/engine");
    } else {
      loadWhiteTestEngine(`../engineVersions/${whiteEngine}`);
    }
  }, [whiteEngine]);

  useEffect(() => {
    if (blackEngine === defaultEngineName) {
      loadBlackTestEngine("../engine/engine");
    } else {
      loadBlackTestEngine(`../engineVersions/${blackEngine}`);
    }
  }, [blackEngine]);

  function handleMakeMove(move: MoveObj, fen: string) {
    const newMoveHistory = [...moveHistory, { fen, move }];

    setMoveHistory(newMoveHistory);

    if (playGame !== null && playGame < testGameFens.length) {
      // Check for draw by repetition
      const lastPosition = newMoveHistory[newMoveHistory.length - 1].fen;
      // Check if the last position has been seen 3 times before (can ignore the last two numbers in the FEN)
      const lastPositionWithoutTurn = lastPosition
        .split(" ")
        .slice(0, 4)
        .join(" ");

      const lastPositionCount = newMoveHistory.filter(
        (move) =>
          move.fen.split(" ").slice(0, 4).join(" ") === lastPositionWithoutTurn
      ).length;

      if (lastPositionCount >= 3) {
        setPlayGame(playGame + 1);
        setDraws((prev) => prev + 1);
        return;
      }

      getGameWinner(lastPosition).then((winner) => {
        if (winner === "draw") {
          setPlayGame(playGame + 1);
          setDraws((prev) => prev + 1);
          return;
        }

        if (winner === "white") {
          setPlayGame(playGame + 1);
          setWins((prev) => prev + 1);
          return;
        }

        if (winner === "black") {
          setPlayGame(playGame + 1);
          setLosses((prev) => prev + 1);
          return;
        }
      });
    }
  }

  return (
    <>
      <h1 className="font-bold text-3xl">Chess</h1>
      <div className="relative flex gap-4 justify-center">
        {/* Engine Selector */}
        <div className="absolute top-0 -left-[4rem] -translate-x-full flex flex-col gap-4 px-4 items-center h-[32rem] justify-center">
          <div className="flex flex-col gap-2">
            <h3 className="text-center font-bold">Black Engine</h3>
            <select
              className="w-full bg-neutral-700 p-1 rounded-md"
              value={blackEngine}
              onChange={(e) => setBlackEngine(e.target.value)}
            >
              {availableEngines.toSorted().map((engine) => (
                <option key={engine} value={engine}>
                  {engine !== defaultEngineName
                    ? engine.split("-").slice(1).join("-").replace(/.exe/g, "")
                    : "Latest"}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-center font-bold">White Engine</h3>
            <select
              className="w-full bg-neutral-700 p-1 rounded-md"
              value={whiteEngine}
              onChange={(e) => setWhiteEngine(e.target.value)}
            >
              {availableEngines.toSorted().map((engine) => (
                <option key={engine} value={engine}>
                  {engine !== defaultEngineName
                    ? engine.split("-").slice(1).join("-").replace(/.exe/g, "")
                    : "Latest"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <EvalBar
          evaluation={evaluation}
          className="absolute -left-[2rem]"
        ></EvalBar>
        <WinBar
          wins={wins}
          losses={losses}
          draws={draws}
          className="absolute -left-[4rem]"
        ></WinBar>
        <div className="flex flex-col items-center gap-4">
          <Board
            startFen={currentFen || STARTING_FEN}
            engineDepth={engineDepth}
            engineTime={engineTime}
            showEngine={showEngine}
            playEngine={playEngine}
            onFenChange={(fen) => setCurrentFen(fen)}
            onEvaluationChange={(newEval) => setEvaluation(newEval)}
            onMakeMove={handleMakeMove}
            getWhiteBestMove={solveWhiteTestEngineBestMove}
            getBlackBestMove={solveBlackTestEngineBestMove}
          ></Board>
          <input
            className="w-[32rem] text-center text-black"
            type="text"
            // disabled
            value={currentFen}
            onChange={(e) => {
              setCurrentFen(e.target.value);
              serverLog("FEN changed to", e.target.value);
            }}
          />
        </div>
        <div className="flex flex-col gap-2 absolute left-[32rem] px-4 w-52">
          <Button
            variant="primary"
            onClick={async () => {
              // Use browser to get version name
              const versionName = window.prompt("Enter version name");
              if (versionName) {
                // Prepend the first 7 digits of the unix timestamp to the version name
                const timestamp = Date.now();
                const newVersionName = `${timestamp
                  .toString()
                  .slice(0, 7)}-${versionName.replace(/\s/g, "-")}`;

                await saveEngine(`../engineVersions/${newVersionName}`);
                const engines = await listEngines();
                setAvailableEngines([...engines, defaultEngineName]);
              }
            }}
          >
            Save Version
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setWins(0);
              setLosses(0);
              setDraws(0);
              setPlayGame(0);
            }}
          >
            Play Matches
          </Button>
          <div className="flex w-full justify-between">
            <input
              className="w-40"
              type="range"
              min={1}
              max={12}
              step={1}
              value={engineDepth}
              onChange={(e) => setEngineDepth(Number.parseInt(e.target.value))}
            />
            <div>{engineDepth}</div>
          </div>
          <div className="flex w-full justify-between ">
            <input
              className="w-40 bg-neutral-700"
              min={1}
              max={10000}
              step={1}
              value={engineTime}
              onChange={(e) =>
                setEngineTime((prev) => {
                  try {
                    if (Number.isNaN(Number.parseInt(e.target.value))) {
                      return prev;
                    }
                    return Number.parseInt(e.target.value);
                  } catch (error) {
                    return prev;
                  }
                })
              }
            />
            <div>ms</div>
          </div>
          <div>
            <h3 className="font-bold mb-1">Show Engine</h3>

            <div className="flex gap-2">
              <input
                type="checkbox"
                id="engine-white"
                checked={showEngine.forWhite}
                onChange={(e) => {
                  setShowEngine({ ...showEngine, forWhite: e.target.checked });
                }}
              />
              <label htmlFor="engine-white">White</label>
            </div>
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="engine-black"
                checked={showEngine.forBlack}
                onChange={(e) => {
                  setShowEngine({ ...showEngine, forBlack: e.target.checked });
                }}
              />
              <label htmlFor="engine-black">Black</label>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-1">Play Engine</h3>

            <div className="flex gap-2">
              <input
                type="checkbox"
                id="play-engine-white"
                checked={playEngine.forWhite}
                onChange={(e) => {
                  setPlayEngine({ ...playEngine, forWhite: e.target.checked });
                }}
              />
              <label htmlFor="play-engine-white">White</label>
            </div>
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="play-engine-black"
                checked={playEngine.forBlack}
                onChange={(e) => {
                  setPlayEngine({ ...playEngine, forBlack: e.target.checked });
                }}
              />
              <label htmlFor="play-engine-black">Black</label>
            </div>
          </div>

          <div className="flex justify-between">
            <h3 className="font-bold mb-1">Moves</h3>
            <h3
              className="mb-1 cursor-pointer hover:underline "
              onClick={() => setMoveHistory([])}
            >
              Clear
            </h3>
          </div>
          <div className="w-full max-h-44 overflow-y-scroll" ref={movesRef}>
            <div className="w-full grid grid-cols-2">
              {moveHistory[0] &&
                boardFromFen(moveHistory[0].fen).turn === Piece.WHITE && (
                  <div className="flex gap-1">
                    <div className="p-1">1.</div>
                    <div className="p-1 rounded-md hover:bg-neutral-700 cursor-pointer transition-colors duration-200 ease-in-out w-full text-center">
                      ...
                    </div>
                  </div>
                )}

              {moveHistory.map((moveStep, index) => {
                const { move, fen } = moveStep;
                const board = boardFromFen(fen);
                const moveStr = `${squareToUci(
                  move.from.y * 8 + move.from.x
                )}${squareToUci(move.to.y * 8 + move.to.x)}`;
                return (
                  <div className="flex gap-1">
                    <div className="p-1">
                      {(index +
                        Number(
                          boardFromFen(moveHistory[0].fen).turn === Piece.WHITE
                        )) %
                        2 ===
                      0
                        ? `${Math.ceil(index / 2 + 1)}. `
                        : ""}
                    </div>
                    <div
                      key={index}
                      className="p-1 rounded-md hover:bg-neutral-700 cursor-pointer transition-colors duration-200 ease-in-out w-full text-center"
                      onClick={() => {
                        setCurrentFen(fen);
                      }}
                    >
                      {moveStr}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
