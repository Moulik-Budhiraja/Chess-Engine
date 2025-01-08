"use server";

import { blackTestEngine, engine, whiteTestEngine } from "..";

export async function reloadEngine() {
  engine.reloadEngine();
}

export async function position(fen: string) {
  return engine.position(fen);
}

export async function getMoves() {
  return engine.getMoves();
}

export async function getBestMove(depth: number, engineTime: number) {
  return engine.getBestMove(depth, engineTime);
}

export async function saveEngine(enginePath: string) {
  return engine.buildEngine(enginePath);
}

export async function listEngines() {
  return engine.listEngines();
}

export async function getGameWinner() {
  return engine.getGameWinner();
}

export async function loadWhiteTestEngine(enginePath: string) {
  whiteTestEngine.loadEngine(enginePath);
}

export async function loadBlackTestEngine(enginePath: string) {
  blackTestEngine.loadEngine(enginePath);
}

export async function positionWhiteTestEngine(fen: string) {
  return whiteTestEngine.position(fen);
}

export async function positionBlackTestEngine(fen: string) {
  return blackTestEngine.position(fen);
}

export async function getWhiteTestEngineBestMove(
  depth: number,
  engineTime: number
) {
  return whiteTestEngine.getBestMove(depth, engineTime);
}

export async function getBlackTestEngineBestMove(
  depth: number,
  engineTime: number
) {
  return blackTestEngine.getBestMove(depth, engineTime);
}
