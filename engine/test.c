#include <stdio.h>

int main() {
    char *arr[5] = {"cs137", "rules", "wagwa", "ncrod", "ie137"};

    char **test = arr;

    for (int i = 0; i < 5; i++) {
        for (int v = 0; v < 5; v++) {
            printf("%d\n", test[i][v]);
        }
    }
}