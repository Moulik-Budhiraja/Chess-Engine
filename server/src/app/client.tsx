"use client";

import Button from "@/components/Button/Button";
import Board from "./Board";
import {
  getMoves,
  position,
  reloadEngine,
} from "@/engine/engineFunctions/engineOperations";
import { useState } from "react";
import { serverLog } from "@/utils/debug/serverLog";
import { STARTING_FEN } from "@/utils/chess/BoardFromFen";

export default function Client() {
  const [currentFen, setCurrentFen] = useState<string>(STARTING_FEN);

  return (
    <>
      <h1 className="font-bold text-3xl">Chess</h1>
      <div className="relative flex gap-4 justify-center">
        <div className="flex flex-col items-center gap-4">
          <Board
            startFen={currentFen || STARTING_FEN}
            onFenChange={(fen) => setCurrentFen(fen)}
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
        </div>
      </div>
    </>
  );
}
