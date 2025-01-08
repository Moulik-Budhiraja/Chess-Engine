#include <iostream>

#include "commandListener.hpp"
#include "positionHash.hpp"
#include "stackvector.hpp"

using namespace std;

int main() {
    EngineInterface engine;
    engine.listen();

    return 0;
}
