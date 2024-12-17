"use server";

import { engine } from "..";

export async function reloadEngine() {
  engine.reloadEngine();
}

export async function position(fen: string) {
  return engine.position(fen);
}

export async function getMoves() {
  return engine.getMoves();
}
