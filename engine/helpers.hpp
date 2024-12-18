#pragma once

#include <string>
#include <vector>

using namespace std;

string vecToString(const vector<string>& vec) {
    string result = "[";

    for (size_t i = 0; i < vec.size(); i++) {
        result += vec[i];
        if (i < vec.size() - 1) {
            result += ", ";
        }
    }

    result += "]";

    return result;
}

string vecToString(const vector<string>& vec, bool noFormat) {
    if (!noFormat) {
        return vecToString(vec);
    }

    string result = "";

    for (size_t i = 0; i < vec.size(); i++) {
        result += vec[i];
        if (i < vec.size() - 1) {
            result += " ";
        }
    }

    return result;
}

string vecToString(const vector<string>& vec, bool noFormat, int start) {
    if (!noFormat) {
        return vecToString(vec);
    }

    string result = "";

    for (size_t i = start; i < vec.size(); i++) {
        result += vec[i];
        if (i < vec.size() - 1) {
            result += " ";
        }
    }

    return result;
}

string vecToString(const vector<string>& vec, bool noFormat, size_t start, size_t end) {
    if (!noFormat) {
        return vecToString(vec);
    }

    if (end > vec.size()) {
        end = vec.size();
    } else if (end < 0) {
        end = vec.size() + end;
    }

    string result = "";

    for (size_t i = start; i < end; i++) {
        result += vec[i];
        if (i < vec.size() - 1) {
            result += " ";
        }
    }

    return result;
}

template <size_t N>
string arrToString(const array<string, N>& arr) {
    string result = "";

    for (size_t i = 0; i < arr.size(); i++) {
        result += arr[i];
        if (i < arr.size() - 1) {
            result += " ";
        }
    }

    return result;
}

bool inBetween(int num, int a, int b) { return a < b ? a <= num && b >= num : b <= num && a >= num; }