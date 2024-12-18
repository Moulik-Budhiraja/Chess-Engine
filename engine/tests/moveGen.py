import re


def parseMoves(moves: list[str]) -> set[tuple[str, int]]:
    moveSet = set()
    for move in moves:
        m = re.match(r"([a-h][1-8][a-h][1-8][qrbn]?): ([0-9]+)", move)
        if m:
            moveSet.add((m.group(1), int(m.group(2))))

    return moveSet


currentInput = input("Enter predicted moves: ")
moves = []

while currentInput != "":
    moves.append(currentInput)
    currentInput = input()


moveSet1 = parseMoves(moves)
print(moveSet1)

currentInput = input("Enter correct moves: ")
moves = []

while currentInput != "":
    moves.append(currentInput)
    currentInput = input()

moveSet2 = parseMoves(moves)

print(moveSet2)

extraMoves = moveSet1 - moveSet2
missingMoves = moveSet2 - moveSet1


def printSet(s: set[tuple[str, int]]):
    for move in s:
        print(f"{move[0]}: {move[1]}")


print()
print("Extra moves:")
printSet(extraMoves)
print()
print("Missing moves:")
printSet(missingMoves)
