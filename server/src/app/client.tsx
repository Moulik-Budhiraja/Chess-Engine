"use client";

import Button from "@/components/Button/Button";
import Board from "./Board";
import {
  getMoves,
  position,
  reloadEngine,
} from "@/engine/engineFunctions/engineOperations";
import { useEffect, useRef, useState } from "react";
import { serverLog } from "@/utils/debug/serverLog";
import { boardFromFen, STARTING_FEN } from "@/utils/chess/BoardFromFen";
import EvalBar from "./EvalBar";
import { MoveObj } from "@/engine/engineFunctions/moves/getValidMoves";
import { Piece } from "@/utils/chess/GetPiece";
import { squareToUci } from "@/engine/engineFunctions/moves/moveHelper";

type MoveStep = {
  fen: string;
  move: MoveObj;
};

export default function Client() {
  const [currentFen, setCurrentFen] = useState<string>(STARTING_FEN);
  const [evaluation, setEvaluation] = useState(0);
  const [engineDepth, setEngineDepth] = useState(6);
  const [engineTime, setEngineTime] = useState(500);
  const [showEngine, setShowEngine] = useState({
    forWhite: false,
    forBlack: true,
  });
  const [playEngine, setPlayEngine] = useState({
    forWhite: false,
    forBlack: false,
  });

  const [moveHistory, setMoveHistory] = useState<MoveStep[]>([]);

  const movesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (movesRef.current) {
      movesRef.current.scrollTop = movesRef.current.scrollHeight;
    }
  }, [moveHistory]);

  return (
    <>
      <h1 className="font-bold text-3xl">Chess</h1>
      <div className="relative flex gap-4 justify-center">
        <EvalBar
          evaluation={evaluation}
          className="absolute -left-[2rem]"
        ></EvalBar>
        <div className="flex flex-col items-center gap-4">
          <Board
            startFen={currentFen || STARTING_FEN}
            engineDepth={engineDepth}
            engineTime={engineTime}
            showEngine={showEngine}
            playEngine={playEngine}
            onFenChange={(fen) => setCurrentFen(fen)}
            onEvaluationChange={(newEval) => setEvaluation(newEval)}
            onMakeMove={(move, fen) =>
              setMoveHistory([...moveHistory, { fen, move }])
            }
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
              await reloadEngine();
            }}
          >
            Reload Engine
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              await position(currentFen);
              console.log(await getMoves());
            }}
          >
            Get Moves
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
