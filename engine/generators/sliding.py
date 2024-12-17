directions = [-8, 8, -1, 1, -9, -7, 7, 9]

getRank = lambda square: square // 8
getFile = lambda square: square % 8


def getSquare(rank, file):
    return rank * 8 + file


def printLikeCppArray(array):
    print("{", end="")
    for i, item in enumerate(array):
        if i != 0:
            print(", ", end="")
        print(item, end="")
    print("}")


def printLikeCpp2DArray(array):
    print("{", end="")
    for i, row in enumerate(array):
        if i != 0:
            print(", ", end="")
        printLikeCppArray(row)
    print("}")


# For each square determine the max sliding distance in each direction

square_distances = []

for start_square in range(64):
    distances = []
    print(f"{start_square}: ")
    for i, direction in enumerate(directions):
        distance = 0
        square = start_square
        start_rank = getRank(start_square)
        start_file = getFile(start_square)

        if i < 4:
            if direction == -8:
                distance = start_rank
            elif direction == 8:
                distance = 7 - start_rank
            elif direction == -1:
                distance = start_file
            elif direction == 1:
                distance = 7 - start_file
        else:
            if direction == -9:
                distance = min(start_rank, start_file)
            elif direction == -7:
                distance = min(start_rank, 7 - start_file)
            elif direction == 7:
                distance = min(7 - start_rank, start_file)
            elif direction == 9:
                distance = min(7 - start_rank, 7 - start_file)

        distances.append(distance)

    square_distances.append(distances)

printLikeCpp2DArray(square_distances)
