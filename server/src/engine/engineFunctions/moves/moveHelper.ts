export function squareToUci(square: number) {
  return String.fromCharCode(97 + (square % 8)) + (Math.floor(square / 8) + 1);
}
