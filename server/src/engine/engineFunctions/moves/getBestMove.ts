"use server";

import {
  getBestMove,
  getBlackTestEngineBestMove,
  getWhiteTestEngineBestMove,
  position,
  positionBlackTestEngine,
  positionWhiteTestEngine,
} from "../engineOperations";
import { getMoveFromUci, MoveObj } from "./getValidMoves";

export type MoveEval = {
  move: MoveObj;
  eval: number;
};

async function solveEngineBestMove(
  fen: string,
  depth: number,
  engineTime: number,
  positionFunction: (fen: string) => Promise<void>,
  getBestMoveFunction: (
    depth: number,
    engineTime: number
  ) => Promise<string | undefined>
): Promise<MoveEval> {
  await positionFunction(fen);
  const bestMoveResult = await getBestMoveFunction(depth, engineTime);

  if (!bestMoveResult)
    return {
      eval: 0,
      move: { from: { x: 0, y: 0 }, to: { x: 0, y: 0 }, promotion: null },
    };

  const moveAndEval: string[] = bestMoveResult.split(" ");
  const move = await getMoveFromUci(moveAndEval[0]);
  const evaluation = parseInt(moveAndEval[1]);

  return {
    move: move,
    eval: evaluation,
  };
}

export async function solveBestMove(
  fen: string,
  depth: number,
  engineTime: number
) {
  return solveEngineBestMove(fen, depth, engineTime, position, getBestMove);
}

export async function solveWhiteTestEngineBestMove(
  fen: string,
  depth: number,
  engineTime: number
) {
  return solveEngineBestMove(
    fen,
    depth,
    engineTime,
    positionWhiteTestEngine,
    getWhiteTestEngineBestMove
  );
}

export async function solveBlackTestEngineBestMove(
  fen: string,
  depth: number,
  engineTime: number
) {
  return solveEngineBestMove(
    fen,
    depth,
    engineTime,
    positionBlackTestEngine,
    getBlackTestEngineBestMove
  );
}
