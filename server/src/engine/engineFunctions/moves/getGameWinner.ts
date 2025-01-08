"use server";

import { engine } from "@/engine";
import { position } from "../engineOperations";

export async function getGameWinner(fen: string) {
  await position(fen);

  return await engine.getGameWinner();
}
