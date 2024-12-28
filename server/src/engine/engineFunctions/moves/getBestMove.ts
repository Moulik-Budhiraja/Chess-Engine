"use server";

import { getBestMove, position } from "../engineOperations";
import { getMoveFromUci, MoveObj } from "./getValidMoves";

type MoveEval = {
  move: MoveObj;
  eval: number;
};

export async function solveBestMove(
  fen: string,
  depth: number,
  engineTime: number
): Promise<MoveEval> {
  await position(fen);
  const bestMoveResult = await getBestMove(depth, engineTime);

  if (!bestMoveResult)
    return {
      eval: 0,
      move: { from: { x: 0, y: 0 }, to: { x: 0, y: 0 } },
    };

  const moveAndEval: string[] = bestMoveResult.split(" ");
  const move = await getMoveFromUci(moveAndEval[0]);
  const evaluation = parseInt(moveAndEval[1]);

  return {
    move: move,
    eval: evaluation,
  };
}
